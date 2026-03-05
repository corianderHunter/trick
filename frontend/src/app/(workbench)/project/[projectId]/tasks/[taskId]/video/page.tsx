"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { fetchProjectTask, updateProjectTask, type ProjectTask } from "@/lib/project-task-api";
import { plainTextToHtml } from "@/lib/html-to-text";
import {
  parseScriptModelResult,
  type ScriptModelUnit,
} from "@/lib/script-model-result";
import {
  fetchMaterials,
  fetchMaterial,
  materialThumbnailUrl,
  type MaterialListItem,
} from "@/lib/material-api";
import {
  VisualQuantify,
  defaultVisualQuantifyValue,
  type VisualQuantifyValue,
} from "@/components/VisualQuantify";
import RichTextEditor from "@/components/RichTextEditor";
import { ViewportTip } from "@/components/ViewportTip";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { BUTTON_BASE, INPUT_BASE } from "@/lib/control-classes";

const TASK_KEY = (projectId: string, taskId: string) =>
  `/api/projects/${projectId}/tasks/${taskId}`;

/** 画面量化说明（与 VisualQuantify 维度一致） */
const VISUAL_QUANTIFY_INFO =
  "色彩饱和度、构图对称性、镜头运动、光影强度、景深感、场景类型等维度调节画面风格。";

/** 任务中已选物料（可编辑标题与每张图片描述） */
export type TaskMaterialItem = {
  materialId: string;
  title: string;
  images: { url: string; displayUrl: string; description: string }[];
};

/** 添加物料弹框：展示物料列表，支持多选 */
function MaterialSelectModal({
  open,
  onClose,
  selectedIds,
  onToggle,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onConfirm: () => void;
}) {
  const { data: list = [], isLoading } = useSWR<MaterialListItem[]>(
    open ? "/api/materials" : null,
    fetchMaterials
  );

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-stone-900/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-lg dark:bg-stone-800">
          <DialogTitle className="shrink-0 border-b border-stone-200 px-4 py-3 text-lg font-semibold text-stone-900 dark:border-stone-700 dark:text-stone-100">
            选择物料
          </DialogTitle>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            {isLoading ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">加载中…</p>
            ) : list.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">暂无物料，请先在物料库添加</p>
            ) : (
              <ul className="space-y-2">
                {list.map((item) => (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 p-3 transition-colors hover:bg-stone-50 dark:border-stone-600 dark:hover:bg-stone-700/50">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => onToggle(item.id)}
                        className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500 dark:border-stone-600"
                      />
                      <span className="flex-1 text-sm font-medium text-stone-900 dark:text-stone-100">
                        {item.title || "未命名物料"}
                      </span>
                      {(item.thumbnails?.length ?? 0) > 0 && (
                        <div className="flex h-8 w-8 shrink-0 overflow-hidden rounded bg-stone-200 dark:bg-stone-700">
                          <img
                            src={materialThumbnailUrl(item.thumbnails[0])}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="shrink-0 flex justify-end gap-2 border-t border-stone-200 px-4 py-3 dark:border-stone-700">
            <button
              type="button"
              onClick={onClose}
              className={`${BUTTON_BASE} border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700`}
            >
              取消
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={selectedIds.size === 0}
              className={`${BUTTON_BASE} bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700`}
            >
              确定（已选 {selectedIds.size}）
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default function TaskVideoPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const taskId = params?.taskId as string;

  const { data: task, mutate: mutateTask } = useSWR<ProjectTask>(
    projectId && taskId ? TASK_KEY(projectId, taskId) : null,
    () => fetchProjectTask(projectId, taskId)
  );

  /** 左栏：剧本输出（来自剧本创作页右侧 scriptModelResult），多编辑器时每项 content 为 HTML */
  const [leftUnits, setLeftUnits] = useState<ScriptModelUnit[] | null>(null);
  const [leftSingleHtml, setLeftSingleHtml] = useState("");
  const [leftEditorKey, setLeftEditorKey] = useState(0);

  /** 中栏：画面量化 */
  const [visualQuantify, setVisualQuantify] = useState<VisualQuantifyValue>(
    defaultVisualQuantifyValue
  );

  /** 中栏：已选物料（可编辑标题与每图描述） */
  const [taskMaterials, setTaskMaterials] = useState<TaskMaterialItem[]>([]);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  /** 弹框内勾选的物料 id */
  const [modalSelectedIds, setModalSelectedIds] = useState<Set<string>>(new Set());

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /** 弹框确认：拉取选中物料详情并追加到中栏 */
  const confirmMaterialSelection = useCallback(async () => {
    if (modalSelectedIds.size === 0) {
      setMaterialModalOpen(false);
      return;
    }
    const ids = Array.from(modalSelectedIds);
    const details = await Promise.all(ids.map((id) => fetchMaterial(id)));
    const newItems: TaskMaterialItem[] = details.map((d) => ({
      materialId: d.id,
      title: d.title ?? "未命名物料",
      images: (d.images ?? []).map((img) => ({
        url: img.url,
        displayUrl: materialThumbnailUrl(img.url),
        description: img.description ?? "",
      })),
    }));
    setTaskMaterials((prev) => {
      const existingIds = new Set(prev.map((m) => m.materialId));
      const toAdd = newItems.filter((m) => !existingIds.has(m.materialId));
      return [...prev, ...toAdd];
    });
    setModalSelectedIds(new Set());
    setMaterialModalOpen(false);
  }, [modalSelectedIds]);

  const removeTaskMaterial = useCallback((materialId: string) => {
    setTaskMaterials((prev) => prev.filter((m) => m.materialId !== materialId));
  }, []);

  const updateTaskMaterialTitle = useCallback((materialId: string, title: string) => {
    setTaskMaterials((prev) =>
      prev.map((m) => (m.materialId === materialId ? { ...m, title } : m))
    );
  }, []);

  const updateTaskMaterialImageDesc = useCallback(
    (materialId: string, imageIndex: number, description: string) => {
      setTaskMaterials((prev) =>
        prev.map((m) => {
          if (m.materialId !== materialId) return m;
          const nextImages = [...m.images];
          if (imageIndex >= 0 && imageIndex < nextImages.length)
            nextImages[imageIndex] = { ...nextImages[imageIndex], description };
          return { ...m, images: nextImages };
        })
      );
    },
    []
  );

  useEffect(() => {
    if (!task?.id) return;
    const result = task.scriptModelResult ?? null;
    if (result != null && result !== "") {
      const parsed = parseScriptModelResult(result);
      if (parsed && parsed.units.length > 0) {
        setLeftUnits(
          parsed.units.map((u) => ({
            ...u,
            content: u.content ? plainTextToHtml(u.content) : "<p></p>",
          }))
        );
        setLeftSingleHtml("");
      } else {
        setLeftUnits(null);
        setLeftSingleHtml(plainTextToHtml(result));
      }
      setLeftEditorKey((k) => k + 1);
    } else {
      setLeftUnits(null);
      setLeftSingleHtml("");
    }
  }, [task?.id, task?.scriptModelResult]);

  /** 右栏视频数量：与左栏分镜数一致，无 units 时为 1 */
  const videoCount = leftUnits && leftUnits.length > 0 ? leftUnits.length : 1;

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <header className="sticky top-0 z-10 shrink-0 border-b border-stone-200 bg-white px-4 py-3 dark:border-stone-700 dark:bg-stone-800/95">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Link
              href={`/project/${projectId}/tasks`}
              className="shrink-0 text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
              aria-label="返回"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                />
              </svg>
            </Link>
            <h1 className="shrink-0 text-base font-semibold text-stone-900 dark:text-stone-100">
              视频创作
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {saveError && (
              <span className="text-sm text-red-600 dark:text-red-400">
                {saveError}
              </span>
            )}
            <button
              type="button"
              disabled={saving}
              className={`${BUTTON_BASE} bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700`}
            >
              {saving ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* 左栏 480px：剧本输出（自动填充自剧本创作页右侧模型输出），多富文本编辑器 */}
        <aside className="flex w-[480px] shrink-0 flex-col overflow-hidden border-r border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800/80">
          <div className="shrink-0 border-b border-stone-100 px-3 py-2 dark:border-stone-700">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              剧本输出
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-2">
            {leftUnits && leftUnits.length > 0 ? (
              <div className="flex flex-col gap-4">
                {leftUnits.map((unit, index) => (
                  <div
                    key={`${leftEditorKey}-unit-${unit.unit_index}-${index}`}
                    className="rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-800/80"
                  >
                    <RichTextEditor
                      content={unit.content}
                      placeholder="该分镜剧本…"
                      rightLabel={`${unit.start_time} – ${unit.end_time}`}
                      onChange={(html) =>
                        setLeftUnits((prev) =>
                          prev
                            ? prev.map((u, i) =>
                                i === index ? { ...u, content: html } : u
                              )
                            : null
                        )
                      }
                      className="min-h-[120px]"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <RichTextEditor
                key={leftEditorKey}
                content={leftSingleHtml}
                placeholder="请先在剧本创作页完成模型输出，内容将自动填充到此"
                onChange={setLeftSingleHtml}
                className="min-h-90 h-full"
              />
            )}
          </div>
        </aside>

        {/* 中栏：画面量化 + 添加物料（下） + 已选物料，宽度 80% 居中、扁平 */}
        <main className="min-w-0 flex-1 overflow-auto bg-stone-50/50 dark:bg-stone-900/30">
          <div className="flex h-full flex-col gap-4 p-6">
            <div className="shrink-0">
              <div className="inline-flex items-center gap-1.5">
                <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  画面量化
                </h2>
                <ViewportTip
                  content={VISUAL_QUANTIFY_INFO}
                  triggerClassName="cursor-default"
                  triggerActiveClassName="text-amber-500 dark:text-amber-400"
                >
                  <InformationCircleIcon
                    className="size-5 text-stone-400 transition-colors dark:text-stone-500"
                    aria-hidden
                  />
                </ViewportTip>
              </div>
              <div className="mt-2 border border-stone-200 bg-white p-3 dark:border-stone-600 dark:bg-stone-800/80">
                <VisualQuantify
                  value={visualQuantify}
                  onChange={setVisualQuantify}
                />
              </div>
            </div>

            <div className="shrink-0 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-600 dark:bg-stone-800/80">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setMaterialModalOpen(true)}
                  className="inline-flex w-[80%] items-center justify-center gap-1.5 rounded border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                >
                  <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  添加物料
                </button>
              </div>

              {taskMaterials.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-stone-200 pt-4 dark:border-stone-600">
                  <h2 className="text-xs font-medium text-stone-600 dark:text-stone-400">
                    已选物料
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {taskMaterials.map((item) => (
                      <li
                        key={item.materialId}
                        className="rounded border border-stone-200 bg-stone-50/80 p-2 dark:border-stone-600 dark:bg-stone-800/50"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) =>
                              updateTaskMaterialTitle(item.materialId, e.target.value)
                            }
                            className="min-w-0 flex-1 rounded border border-stone-200 bg-white px-2 py-1 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
                            placeholder="物料标题"
                          />
                          <button
                            type="button"
                            onClick={() => removeTaskMaterial(item.materialId)}
                            className="shrink-0 rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-700 dark:hover:text-stone-300"
                            aria-label="移除此物料"
                          >
                            <XMarkIcon className="size-4" />
                          </button>
                        </div>
                        <ul className="mt-2 space-y-1.5">
                          {item.images.map((img, idx) => (
                            <li
                              key={idx}
                              className="flex items-center gap-2 border-t border-stone-100 pt-1.5 dark:border-stone-700"
                            >
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-stone-200 dark:bg-stone-700">
                                {img.displayUrl ? (
                                  <img
                                    src={img.displayUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-stone-400">
                                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <input
                                type="text"
                                value={img.description}
                                onChange={(e) =>
                                  updateTaskMaterialImageDesc(
                                    item.materialId,
                                    idx,
                                    e.target.value
                                  )
                                }
                                className="min-w-0 flex-1 rounded border border-stone-200 bg-white px-2 py-1 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
                                placeholder="图片描述"
                              />
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* 添加物料弹框：物料列表多选 */}
        <MaterialSelectModal
          open={materialModalOpen}
          onClose={() => {
            setMaterialModalOpen(false);
            setModalSelectedIds(new Set());
          }}
          selectedIds={modalSelectedIds}
          onToggle={(id) => {
            setModalSelectedIds((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          }}
          onConfirm={confirmMaterialSelection}
        />

        {/* 右栏 480px：多个视频从上到下平铺（占位） */}
        <aside className="flex w-[480px] shrink-0 flex-col overflow-hidden border-l border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800/80">
          <div className="shrink-0 border-b border-stone-100 px-3 py-2 dark:border-stone-700">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              视频
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-2">
            <div className="flex flex-col gap-4">
              {Array.from({ length: videoCount }, (_, i) => (
                <div
                  key={i}
                  className="flex aspect-video w-full items-center justify-center rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 dark:border-stone-600 dark:bg-stone-800/50"
                >
                  <div className="flex flex-col items-center gap-2 text-stone-400 dark:text-stone-500">
                    <svg
                      className="size-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm font-medium">视频 {i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
