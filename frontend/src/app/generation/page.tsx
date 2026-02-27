"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  fetchGenerationList,
  fetchGeneration,
  deleteGeneration,
  type GenerationTask,
} from "@/lib/generation-api";

const LIST_KEY = "/api/generation";

function formatDate(s: string) {
  try {
    const d = new Date(s);
    return d.toLocaleString("zh-CN");
  } catch {
    return s;
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "等待中",
    processing: "生成中",
    completed: "已完成",
    failed: "失败",
  };
  return map[status] ?? status;
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    pending: "bg-stone-200 text-stone-700 dark:bg-stone-600 dark:text-stone-300",
    processing: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  };
  return map[status] ?? "bg-stone-200 text-stone-700";
}

function contentPreview(content: string, maxLen = 100) {
  const t = (content ?? "").trim().replace(/\s+/g, " ");
  return t.length <= maxLen ? t : t.slice(0, maxLen) + "…";
}

const RHYTHM_LABELS: Record<string, string> = {
  fragment: "碎片",
  flat: "平直",
  fast: "快节奏",
};
const CAMERA_LABELS: Record<string, string> = {
  static: "静态",
  dolly: "推拉",
  follow: "跟拍",
};

function formatDialogueQuantifyLabels(d: Record<string, unknown> | null | undefined): string[] {
  if (!d || typeof d !== "object") return [];
  const lines: string[] = [];
  if (typeof d.rhetoricalDensity === "number")
    lines.push(`修辞密度 ${d.rhetoricalDensity}（${d.rhetoricalDensity <= 2 ? "口语化" : d.rhetoricalDensity >= 4 ? "诗性隐喻" : "适中"}）`);
  if (typeof d.emotionalExplicitness === "number")
    lines.push(`情绪显性度 ${d.emotionalExplicitness}（${d.emotionalExplicitness <= 2 ? "隐藏" : d.emotionalExplicitness >= 4 ? "外放" : "适中"}）`);
  if (typeof d.dramaticTension === "number") lines.push(`戏剧张力 ${d.dramaticTension}`);
  if (typeof d.rhythmStructure === "string")
    lines.push(`节奏结构 ${RHYTHM_LABELS[d.rhythmStructure] ?? d.rhythmStructure}`);
  if (Array.isArray(d.registerLevel) && d.registerLevel.length > 0)
    lines.push(`语域层级 ${d.registerLevel.join("、")}`);
  if (typeof d.narrativeExplicitness === "number")
    lines.push(`叙事显性度 ${d.narrativeExplicitness}`);
  return lines;
}

function formatVisualQuantifyLabels(v: Record<string, unknown> | null | undefined): string[] {
  if (!v || typeof v !== "object") return [];
  const lines: string[] = [];
  if (typeof v.colorSaturation === "number") lines.push(`色彩饱和度 ${v.colorSaturation}`);
  if (typeof v.compositionSymmetry === "number") lines.push(`构图对称性 ${v.compositionSymmetry}`);
  if (typeof v.cameraMovement === "string")
    lines.push(`镜头运动 ${CAMERA_LABELS[v.cameraMovement] ?? v.cameraMovement}`);
  if (typeof v.lightShadowIntensity === "number") lines.push(`光影强度 ${v.lightShadowIntensity}`);
  if (typeof v.depthOfField === "number") lines.push(`景深感 ${v.depthOfField}`);
  if (Array.isArray(v.sceneType) && v.sceneType.length > 0)
    lines.push(`场景类型 ${v.sceneType.join("、")}`);
  return lines;
}

export default function GenerationListPage() {
  const { data: list = [], isLoading, mutate } = useSWR(LIST_KEY, fetchGenerationList, {
    refreshInterval: (data) => {
      const items = data ?? [];
      const hasInProgress = items.some(
        (t) => t.status === "pending" || t.status === "processing"
      );
      return hasInProgress ? 3000 : 0;
    },
  });
  const [resultTask, setResultTask] = useState<GenerationTask | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const openResultModal = useCallback(async (task: GenerationTask) => {
    if (task.status !== "completed") return;
    setModalOpen(true);
    setResultTask(null);
    setLoadingResult(true);
    try {
      const full = await fetchGeneration(task.id);
      setResultTask(full);
    } catch {
      setResultTask(null);
    } finally {
      setLoadingResult(false);
    }
  }, []);

  const closeResultModal = useCallback(() => {
    setModalOpen(false);
    setResultTask(null);
  }, []);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedContentId, setExpandedContentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyResult = useCallback(async () => {
    if (!resultTask?.result) return;
    try {
      await navigator.clipboard.writeText(resultTask.result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [resultTask?.result]);

  const handleDelete = useCallback(
    async (task: GenerationTask) => {
      if (!confirm("确定删除这条生成记录？")) return;
      setDeletingId(task.id);
      try {
        await deleteGeneration(task.id);
        if (resultTask?.id === task.id) closeResultModal();
        await mutate();
      } catch (err) {
        alert(err instanceof Error ? err.message : "删除失败");
      } finally {
        setDeletingId(null);
      }
    },
    [mutate, resultTask?.id, closeResultModal]
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold text-stone-900 dark:text-stone-100">
          生成记录
        </h1>

        {isLoading ? (
          <p className="text-stone-500 dark:text-stone-400">加载中…</p>
        ) : list.length === 0 ? (
          <p className="text-stone-500 dark:text-stone-400">暂无生成记录</p>
        ) : (
          <ul className="space-y-4">
            {list.map((task) => (
              <li key={task.id}>
                <article className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-600 dark:bg-stone-800">
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(task.status)}`}
                      >
                        {statusLabel(task.status)}
                      </span>
                      <span className="text-sm text-stone-500 dark:text-stone-400">
                        {formatDate(task.createdAt)}
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-stone-600 dark:text-stone-300">
                      {task.modelConfig?.name ?? "未知模型"}
                    </p>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {formatDialogueQuantifyLabels(task.dialogueQuantify).length > 0 && (
                        <div className="rounded-lg bg-stone-100/80 px-3 py-2 text-xs text-stone-600 dark:bg-stone-700/50 dark:text-stone-400">
                          <span className="font-medium">台词 </span>
                          {formatDialogueQuantifyLabels(task.dialogueQuantify).map((line, i) => (
                            <span key={i}>
                              {i > 0 ? " · " : ""}
                              {line}
                            </span>
                          ))}
                        </div>
                      )}
                      {formatVisualQuantifyLabels(task.visualQuantify).length > 0 && (
                        <div className="rounded-lg bg-stone-100/80 px-3 py-2 text-xs text-stone-600 dark:bg-stone-700/50 dark:text-stone-400">
                          <span className="font-medium">画面 </span>
                          {formatVisualQuantifyLabels(task.visualQuantify).map((line, i) => (
                            <span key={i}>
                              {i > 0 ? " · " : ""}
                              {line}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-stone-500 dark:text-stone-400">
                        {expandedContentId === task.id
                          ? (task.content ?? "").trim().replace(/\s+/g, " ")
                          : contentPreview(task.content, 100)}
                      </p>
                      {(task.content ?? "").trim().replace(/\s+/g, " ").length > 100 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedContentId((id) => (id === task.id ? null : task.id))
                          }
                          className="mt-1 text-xs text-amber-600 hover:underline dark:text-amber-400"
                        >
                          {expandedContentId === task.id ? "收起" : "展开全文"}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {task.status === "completed" && (
                        <button
                          type="button"
                          onClick={() => openResultModal(task)}
                          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
                        >
                          查看结果
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(task)}
                        disabled={deletingId === task.id}
                        className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-100"
                      >
                        {deletingId === task.id ? "删除中…" : "删除"}
                      </button>
                    </div>
                    {task.status === "failed" && task.errorMessage && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {task.errorMessage}
                      </p>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 结果弹框 */}
      <Dialog
        open={modalOpen}
        onClose={closeResultModal}
        className="relative z-50"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/50" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-stone-900">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-200 px-6 py-4 dark:border-stone-700">
              <DialogTitle className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                生成结果
              </DialogTitle>
              <div className="flex items-center gap-2">
                {resultTask?.result && (
                  <button
                    type="button"
                    onClick={handleCopyResult}
                    className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-700"
                  >
                    {copied ? "已复制" : "复制文本"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeResultModal}
                  className="rounded-lg bg-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-300 dark:bg-stone-600 dark:text-stone-200 dark:hover:bg-stone-500"
                >
                  关闭
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {loadingResult ? (
                <p className="text-stone-500">加载中…</p>
              ) : resultTask?.result ? (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                  {resultTask.result}
                </pre>
              ) : (
                <p className="text-stone-500">无结果内容</p>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}


