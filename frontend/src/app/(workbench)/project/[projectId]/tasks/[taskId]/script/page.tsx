"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { fetchProject } from "@/lib/project-api";
import {
  fetchEbookChapters,
  fetchChapterContent,
  type EbookChapter,
} from "@/lib/ebook-api";
import {
  fetchProjectTask,
  fetchProjectTasks,
  fetchScriptCallStatus,
  updateProjectTask,
  type ProjectTask,
} from "@/lib/project-task-api";
import { plainTextToHtml, htmlToPlainText } from "@/lib/html-to-text";
import {
  parseScriptModelResult,
  type ScriptModelUnit,
  type ScriptModelResult,
} from "@/lib/script-model-result";
import { useModelConfigs } from "@/hooks/useModelConfigs";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import {
  DialogueQuantify,
  defaultDialogueQuantifyValue,
  type DialogueQuantifyValue,
} from "@/components/DialogueQuantify";
import RichTextEditor from "@/components/RichTextEditor";
import StyleSelector, { type SelectorOption } from "@/components/StyleSelector";
import { ViewportTip } from "@/components/ViewportTip";
import { BUTTON_BASE } from "@/lib/control-classes";

/** 将纯文本转为 TipTap 可用的简单 HTML（按段落） */
function textToHtml(text: string): string {
  if (!text.trim()) return "<p></p>";
  const paras = text.split(/\n\n+/).filter((p) => p.trim());
  if (paras.length === 0) return "<p></p>";
  return paras.map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
}

/** 判断富文本内容是否为空（无实质文字） */
function isEditorContentEmpty(html: string): boolean {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const text = doc.body.textContent?.trim() ?? "";
  return text.length === 0;
}

type ContentSource = "none" | "chapter" | "manual";

/** 台词量化指标说明（与 DialogueQuantify 维度一致） */
const QUANTIFY_INFO =
  "修辞密度（1–5）：口语化到诗性隐喻密集。情绪显性度（1–5）：隐藏到外放。戏剧张力（1–5）：弱到强。节奏结构：碎片 / 平直 / 快节奏。语域层级：口语、文艺、学术、类型化可多选。叙事显性度（1–5）：只表达情绪到推进剧情。";

const TASK_KEY = (projectId: string, taskId: string) =>
  `/api/projects/${projectId}/tasks/${taskId}`;
const SCRIPT_CALL_STATUS_KEY = (projectId: string, taskId: string) =>
  `/api/projects/${projectId}/tasks/${taskId}/script-call-status`;

const SCRIPT_MODEL_STORAGE_KEY = (projectId: string) =>
  `trick:script-model:${projectId}`;

export default function TaskScriptPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const taskId = params?.taskId as string;
  const [contentSource, setContentSource] = useState<ContentSource>("none");
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [leftEditorHtml, setLeftEditorHtml] = useState<string>("");
  const [rightEditorHtml, setRightEditorHtml] = useState<string>("");
  /** 当 AI 返回 units 结构时，按分镜展示；每项 content 为编辑器 HTML */
  const [rightUnits, setRightUnits] = useState<ScriptModelUnit[] | null>(null);
  const [dialogueQuantify, setDialogueQuantify] =
    useState<DialogueQuantifyValue>(defaultDialogueQuantifyValue);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<'save' | 'model' | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { models } = useModelConfigs();
  const modelOptions: SelectorOption[] = useMemo(
    () =>
      models.map((m) => ({
        id: m.id,
        label: m.name,
        description: m.description ?? undefined,
      })),
    [models]
  );
  const [selectedModelId, setSelectedModelId] = useState<string>("");

  const [polling, setPolling] = useState(false);
  const { data: task, mutate: mutateTask } = useSWR<ProjectTask>(
    projectId && taskId ? TASK_KEY(projectId, taskId) : null,
    () => fetchProjectTask(projectId, taskId)
  );

  const { data: callStatusData } = useSWR(
    polling && projectId && taskId
      ? SCRIPT_CALL_STATUS_KEY(projectId, taskId)
      : null,
    () => fetchScriptCallStatus(projectId, taskId),
    { refreshInterval: 2000 }
  );

  useEffect(() => {
    if (!polling || !callStatusData) return;
    if (callStatusData.scriptModelCallStatus !== "calling") {
      setPolling(false);
      void mutateTask();
    }
  }, [polling, callStatusData?.scriptModelCallStatus, callStatusData, mutateTask]);

  useEffect(() => {
    if (!projectId) return;
    const key = SCRIPT_MODEL_STORAGE_KEY(projectId);
    const fromTask = task?.scriptModelId?.trim();
    if (fromTask && models.some((m) => m.id === fromTask)) {
      setSelectedModelId(fromTask);
      if (typeof window !== "undefined") localStorage.setItem(key, fromTask);
      return;
    }
    const cached = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    const validCached = cached && models.some((m) => m.id === cached);
    if (validCached) {
      setSelectedModelId(cached);
    } else if (models.length > 0) {
      setSelectedModelId(models[0].id);
      if (typeof window !== "undefined") localStorage.setItem(key, models[0].id);
    } else {
      setSelectedModelId("");
    }
  }, [projectId, models, task?.scriptModelId]);

  const handleModelChange = (id: string) => {
    setSelectedModelId(id);
    if (projectId && typeof window !== "undefined")
      localStorage.setItem(SCRIPT_MODEL_STORAGE_KEY(projectId), id);
  };

  const prevTaskIdRef = useRef<string | null>(null);
  const lastFilledResultRef = useRef<string | null>(null);
  useEffect(() => {
    prevTaskIdRef.current = null;
    lastFilledResultRef.current = null;
  }, [taskId]);
  useEffect(() => {
    if (!task?.id) return;
    if (prevTaskIdRef.current === task.id) return;
    prevTaskIdRef.current = task.id;
    const body = task.scriptBody ?? "";
    if (body.trim() !== "") {
      setLeftEditorHtml(body);
      setContentSource("chapter");
    } else {
      setLeftEditorHtml("");
      setContentSource("none");
    }
    if (task.scriptDialogueQuantify && typeof task.scriptDialogueQuantify === "object") {
      setDialogueQuantify({
        ...defaultDialogueQuantifyValue,
        ...task.scriptDialogueQuantify,
      } as DialogueQuantifyValue);
    }
    const result = task.scriptModelResult ?? null;
    if (result != null && result !== "") {
      const parsed = parseScriptModelResult(result);
      if (parsed && parsed.units.length > 0) {
        setRightUnits(
          parsed.units.map((u) => ({
            ...u,
            content: u.content ? plainTextToHtml(u.content) : "<p></p>",
          }))
        );
        setRightEditorHtml("");
      } else {
        setRightUnits(null);
        setRightEditorHtml(plainTextToHtml(result));
      }
      lastFilledResultRef.current = result;
      setRightEditorKey((k) => k + 1);
    } else {
      setRightUnits(null);
      setRightEditorHtml("");
      lastFilledResultRef.current = null;
    }
  }, [task?.id, task?.scriptBody, task?.scriptDialogueQuantify]);

  const [rightEditorKey, setRightEditorKey] = useState(0);
  useEffect(() => {
    const result = task?.scriptModelResult ?? null;
    if (result == null || result === "") return;
    if (lastFilledResultRef.current === result) return;
    lastFilledResultRef.current = result;
    const parsed = parseScriptModelResult(result);
    if (parsed && parsed.units.length > 0) {
      setRightUnits(
        parsed.units.map((u) => ({
          ...u,
          content: u.content ? plainTextToHtml(u.content) : "<p></p>",
        }))
      );
      setRightEditorHtml("");
    } else {
      setRightUnits(null);
      setRightEditorHtml(plainTextToHtml(result));
    }
    setRightEditorKey((k) => k + 1);
  }, [task?.scriptModelResult]);

  const { data: project } = useSWR(
    projectId ? `/api/projects/${projectId}` : null,
    () => fetchProject(projectId)
  );
  const ebookId = project?.ebookId ?? null;

  const { data: projectTasks = [] } = useSWR<ProjectTask[]>(
    projectId ? `/api/projects/${projectId}/tasks` : null,
    () => fetchProjectTasks(projectId)
  );
  const hasScriptCallInProgress = projectTasks.some(
    (t) => t.scriptModelCallStatus === "calling"
  );

  const { data: chapters = [] } = useSWR<EbookChapter[]>(
    ebookId ? `/api/ebooks/${ebookId}/chapters` : null,
    () => fetchEbookChapters(ebookId!)
  );

  const showTwoButtons = contentSource === "none";

  const [chapterConfirmLoading, setChapterConfirmLoading] = useState(false);

  const handleSelectChapterInDialog = (chapterId: string) => {
    setSelectedChapterId(chapterId);
  };

  const handleConfirmChapter = async () => {
    if (!selectedChapterId || !ebookId) return;
    setChapterConfirmLoading(true);
    try {
      const raw = await fetchChapterContent(ebookId, selectedChapterId);
      const html = textToHtml(raw ?? "");
      setLeftEditorHtml(html);
      setContentSource("chapter");
      setChapterDialogOpen(false);
    } finally {
      setChapterConfirmLoading(false);
    }
  };

  const handleManualAdd = () => {
    setLeftEditorHtml("");
    setContentSource("manual");
  };

  const handleLeftEditorBlur = () => {
    if (isEditorContentEmpty(leftEditorHtml)) {
      setContentSource("none");
    }
  };

  const getScriptModelResultPayload = (): string | null => {
    if (rightUnits && rightUnits.length > 0) {
      const payload: ScriptModelResult = {
        title: "",
        total_duration: rightUnits.reduce((s, u) => s + (u.duration || 0), 0),
        units: rightUnits.map((u) => ({
          ...u,
          content: u.content ? htmlToPlainText(u.content) : "",
        })),
      };
      return JSON.stringify(payload);
    }
    if (rightEditorHtml.trim()) return htmlToPlainText(rightEditorHtml);
    return null;
  };

  const handleSave = async () => {
    if (!projectId || !taskId) return;
    setSaveError(null);
    setSaveAction("save");
    setSaving(true);
    try {
      const scriptStatus = "in_progress";
      const scriptModelResult = getScriptModelResultPayload();
      const payload: Parameters<typeof updateProjectTask>[2] = {
        scriptStatus,
        scriptBody: leftEditorHtml,
        scriptModelId: selectedModelId.trim() || null,
        scriptDialogueQuantify: dialogueQuantify,
        triggerScriptModel: false,
      };
      if (scriptModelResult != null) payload.scriptModelResult = scriptModelResult;
      const updated = await updateProjectTask(projectId, taskId, payload);
      await mutateTask(updated, false);
      await globalMutate(`/api/projects/${projectId}/tasks`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
      setSaveAction(null);
    }
  };

  const handleTriggerModel = async () => {
    if (!projectId || !taskId) return;
    setSaveError(null);
    if (isEditorContentEmpty(leftEditorHtml)) {
      setSaveError("正文内容不能为空");
      return;
    }
    if (!selectedModelId?.trim()) {
      setSaveError("请选择模型");
      return;
    }
    setSaveAction("model");
    setSaving(true);
    try {
      const scriptStatus = "in_progress";
      const updated = await updateProjectTask(projectId, taskId, {
        scriptStatus,
        scriptBody: leftEditorHtml,
        scriptModelId: selectedModelId.trim() || null,
        scriptDialogueQuantify: dialogueQuantify,
        triggerScriptModel: true,
      });
      await mutateTask(updated, false);
      await globalMutate(`/api/projects/${projectId}/tasks`);
      if (updated.scriptModelCallStatus === "calling") setPolling(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "调用失败");
    } finally {
      setSaving(false);
      setSaveAction(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <header className="sticky top-0 z-10 shrink-0 border-b border-stone-200 bg-white px-4 py-3 dark:border-stone-700 dark:bg-stone-800/95">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Link
              href={`/project/${projectId}/tasks`}
              className="flex shrink-0 items-center text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
              aria-label="Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
              </svg>
            </Link>
            <h1 className="shrink-0 text-base font-semibold text-stone-900 dark:text-stone-100">
              剧本创作
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {/* 模型调用状态：顶部右侧，绿色呼吸灯（轮询时用轻量接口状态） */}
            {(() => {
              const status =
                polling && callStatusData?.scriptModelCallStatus != null
                  ? callStatusData.scriptModelCallStatus
                  : (task?.scriptModelCallStatus ?? "not_called");
              const label =
                status === "calling"
                  ? "调用中"
                  : status === "completed"
                    ? "已完成"
                    : status === "failed"
                      ? "调用失败"
                      : "未调用";
              return (
                <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                  {status === "calling" && (
                    <span
                      className="breathing-dot size-2.5 shrink-0 rounded-full bg-green-500"
                      aria-hidden
                    />
                  )}
                  {status === "completed" && (
                    <span
                      className="size-2.5 shrink-0 rounded-full bg-green-500"
                      aria-hidden
                    />
                  )}
                  {status === "failed" && (
                    <span
                      className="size-2.5 shrink-0 rounded-full bg-red-500"
                      aria-hidden
                    />
                  )}
                  {(status === "not_called" || !status) && (
                    <span
                      className="size-2.5 shrink-0 rounded-full bg-stone-300 dark:bg-stone-600"
                      aria-hidden
                    />
                  )}
                  <span>{label}</span>
                </div>
              );
            })()}
            <div className="min-w-0 max-w-52">
              <StyleSelector
                label=""
                options={modelOptions}
                value={selectedModelId}
                onChange={handleModelChange}
                placeholder="选择模型"
                inlineLabel
              />
            </div>
            {saveError && (
              <span className="text-sm text-red-600 dark:text-red-400">{saveError}</span>
            )}
            {hasScriptCallInProgress && !saving && (
              <span className="text-sm text-amber-600 dark:text-amber-400">
                当前项目有模型调用进行中，请等待完成后再试
              </span>
            )}
            <button
              type="button"
              onClick={handleTriggerModel}
              disabled={saving || hasScriptCallInProgress}
              className={`${BUTTON_BASE} bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700`}
            >
              {saving && saveAction === "model" ? "调用中…" : "模型调用"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`${BUTTON_BASE} text-white transition-colors hover:bg-amber-600 disabled:opacity-50 dark:hover:bg-amber-700 bg-amber-500 dark:bg-amber-600`}
            >
              {saving && saveAction === "save" ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* 左栏 480px：正文始终在此。无正文时显示「章节提取」「手动添加」；有正文时为富文本编辑区，空且离焦时复原为两按钮 */}
        <aside className="w-[480px] shrink-0 border-r border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800/80">
          <div className="flex h-full flex-col overflow-hidden">
            {showTwoButtons && (
              <div className="flex flex-col gap-3 p-4">
                <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  添加正文
                </h2>
                <button
                  type="button"
                  onClick={() => setChapterDialogOpen(true)}
                  disabled={!ebookId || chapters.length === 0}
                  className={`${BUTTON_BASE} border border-stone-300 bg-white text-stone-700 shadow-sm transition-colors hover:bg-stone-50 disabled:opacity-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700`}
                >
                  章节提取
                </button>
                <button
                  type="button"
                  onClick={handleManualAdd}
                  className={`${BUTTON_BASE} border border-stone-300 bg-white text-stone-700 shadow-sm transition-colors hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700`}
                >
                  手动添加
                </button>
                {!ebookId && (
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    当前项目未关联电子书，仅可手动添加
                  </p>
                )}
              </div>
            )}
            {(contentSource === "chapter" || contentSource === "manual") && (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="shrink-0 border-b border-stone-100 px-3 py-2 dark:border-stone-700">
                  <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                    {contentSource === "chapter" ? "正文（来自章节）" : "手动输入正文"}
                  </span>
                </div>
                <div className="min-h-0 flex-1 overflow-auto p-2">
                  <RichTextEditor
                    key={contentSource}
                    content={contentSource === "chapter" ? leftEditorHtml : ""}
                    placeholder="在此输入或粘贴正文…"
                    onChange={(html) => setLeftEditorHtml(html)}
                    onBlur={handleLeftEditorBlur}
                    className="min-h-90 h-full"
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* 中栏：台词量化编辑（与随想页 DialogueQuantify 一致） */}
        <main className="min-w-0 flex-1 overflow-auto bg-stone-50/50 dark:bg-stone-900/30">
          <div className="flex h-full flex-col p-6">
            <div className="shrink-0">
              <div className="inline-flex items-center gap-1.5">
                <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  台词量化
                </h2>
                <ViewportTip
                  content={QUANTIFY_INFO}
                  triggerClassName="cursor-default"
                  triggerActiveClassName="text-amber-500 dark:text-amber-400"
                >
                  <InformationCircleIcon
                    className="size-5 text-stone-400 transition-colors dark:text-stone-500"
                    aria-hidden
                  />
                </ViewportTip>
              </div>
            </div>
            <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-800/80">
              <DialogueQuantify
                value={dialogueQuantify}
                onChange={setDialogueQuantify}
              />
            </div>
          </div>
        </main>

        {/* 右栏 480px：模型结果；units 时按分镜平铺多个编辑器，否则单编辑器 */}
        <aside className="flex w-[480px] shrink-0 flex-col overflow-hidden border-l border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800/80">
          <div className="shrink-0 border-b border-stone-100 px-3 py-2 dark:border-stone-700">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              模型输出
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-2">
            {rightUnits && rightUnits.length > 0 ? (
              <div className="flex flex-col gap-4">
                {rightUnits.map((unit, index) => (
                  <div
                    key={`${rightEditorKey}-unit-${unit.unit_index}-${index}`}
                    className="rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-800/80"
                  >
                    <RichTextEditor
                      content={unit.content}
                      placeholder="该分镜正文…"
                      rightLabel={`${unit.start_time} – ${unit.end_time}`}
                      onChange={(html) =>
                        setRightUnits((prev) =>
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
                key={rightEditorKey}
                content={rightEditorHtml}
                placeholder="保存后将自动调用模型，结果会填充到此…"
                onChange={(html) => setRightEditorHtml(html)}
                className="min-h-90 h-full"
              />
            )}
          </div>
        </aside>
      </div>

      {/* 目录章节选择对话框 */}
      <Dialog
        open={chapterDialogOpen}
        onClose={() => setChapterDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-stone-800">
            <DialogTitle className="shrink-0 border-b border-stone-200 px-4 py-3 text-base font-semibold text-stone-900 dark:border-stone-700 dark:text-stone-100">
              选择章节
            </DialogTitle>
            <div className="min-h-0 flex-1 overflow-auto">
              {chapters.length === 0 ? (
                <p className="p-4 text-sm text-stone-500 dark:text-stone-400">
                  暂无章节目录
                </p>
              ) : (
                <ul className="p-2">
                  {chapters.map((ch) => (
                    <li key={ch.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectChapterInDialog(ch.id)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${selectedChapterId === ch.id
                          ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
                          : "text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700"
                          }`}
                      >
                        <span className="line-clamp-2">
                          {ch.title?.trim() || `第 ${ch.chapterIndex + 1} 章`}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="shrink-0 flex justify-end gap-2 border-t border-stone-200 p-3 dark:border-stone-700">
              <button
                type="button"
                onClick={() => setChapterDialogOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmChapter}
                disabled={!selectedChapterId || chapterConfirmLoading}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
              >
                {chapterConfirmLoading ? "加载中…" : "确定"}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
