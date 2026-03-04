"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { fetchProjectTask, updateProjectTask, type ProjectTask } from "@/lib/project-task-api";
import { plainTextToHtml } from "@/lib/html-to-text";
import {
  parseScriptModelResult,
  type ScriptModelUnit,
} from "@/lib/script-model-result";
import {
  VisualQuantify,
  defaultVisualQuantifyValue,
  type VisualQuantifyValue,
} from "@/components/VisualQuantify";
import RichTextEditor from "@/components/RichTextEditor";
import { ViewportTip } from "@/components/ViewportTip";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { BUTTON_BASE } from "@/lib/control-classes";

const TASK_KEY = (projectId: string, taskId: string) =>
  `/api/projects/${projectId}/tasks/${taskId}`;

/** 画面量化说明（与 VisualQuantify 维度一致） */
const VISUAL_QUANTIFY_INFO =
  "色彩饱和度、构图对称性、镜头运动、光影强度、景深感、场景类型等维度调节画面风格。";

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

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

        {/* 中栏：画面量化（与随想页一致） */}
        <main className="min-w-0 flex-1 overflow-auto bg-stone-50/50 dark:bg-stone-900/30">
          <div className="flex h-full flex-col p-6">
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
            </div>
            <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-800/80">
              <VisualQuantify
                value={visualQuantify}
                onChange={setVisualQuantify}
              />
            </div>
          </div>
        </main>

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
