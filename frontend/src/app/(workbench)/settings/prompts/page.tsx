"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  fetchPrompts,
  updatePrompt,
  type PromptItem,
  type PromptKey,
} from "@/lib/prompt-api";
import RichTextEditor from "@/components/RichTextEditor";
import { BUTTON_BASE } from "@/lib/control-classes";

const PROMPTS_KEY = "/api/prompts";

const LABELS: Record<PromptKey, string> = {
  script: "剧本 Prompt",
  visual: "画面 Prompt",
};

export default function PromptsSettingsPage() {
  const { data: items = [], mutate } = useSWR<PromptItem[]>(PROMPTS_KEY, fetchPrompts);
  const [savingKey, setSavingKey] = useState<PromptKey | null>(null);
  const [errorByKey, setErrorByKey] = useState<Partial<Record<PromptKey, string>>>({});
  const [draft, setDraft] = useState<Partial<Record<PromptKey, string>>>({});
  const [editorVersion, setEditorVersion] = useState<Record<PromptKey, number>>({ script: 0, visual: 0 });

  const getContent = (key: PromptKey) =>
    draft[key] !== undefined ? draft[key]! : items.find((i) => i.key === key)?.content ?? "";

  const setContent = (key: PromptKey, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrorByKey((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSave = async (key: PromptKey) => {
    const content = getContent(key);
    setSavingKey(key);
    setErrorByKey((prev) => ({ ...prev, [key]: undefined }));
    try {
      await updatePrompt(key, content);
      setDraft((prev) => ({ ...prev, [key]: undefined }));
      await mutate();
      setEditorVersion((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
    } catch (e) {
      setErrorByKey((prev) => ({
        ...prev,
        [key]: e instanceof Error ? e.message : "保存失败",
      }));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-stone-50 via-amber-50/30 to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <header className="mb-10 flex items-center gap-4">
          <Link
            href="/settings"
            className="rounded-lg p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            title="返回设置"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              Prompt 管理
            </h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              剧本创作与画面生成使用的提示词，保存为一段说明即可；风格与正文由系统自动拼接
            </p>
          </div>
        </header>

        <div className="space-y-8">
          {(["script", "visual"] as const).map((key) => (
            <section
              key={key}
              className="rounded-2xl border border-stone-200 bg-white/80 p-6 shadow-sm dark:border-stone-700 dark:bg-stone-900/80"
            >
              <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
                {LABELS[key]}
              </h2>
              <div className="mt-4 min-h-[280px]">
                <RichTextEditor
                  key={`${key}-${editorVersion[key] ?? 0}-${items.length}`}
                  content={getContent(key)}
                  placeholder={`请输入 ${LABELS[key]} 说明…`}
                  onChange={(html) => setContent(key, html)}
                  className="min-h-[280px]"
                />
              </div>
              {errorByKey[key] && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errorByKey[key]}
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSave(key)}
                  disabled={savingKey === key}
                  className={`${BUTTON_BASE} bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700`}
                >
                  {savingKey === key ? "保存中…" : "保存"}
                </button>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
