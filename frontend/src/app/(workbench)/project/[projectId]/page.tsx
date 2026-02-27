"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { fetchProject, updateProject, type Project } from "@/lib/project-api";
import {
  DialogueQuantify,
  defaultDialogueQuantifyValue,
  type DialogueQuantifyValue,
} from "@/components/DialogueQuantify";
import {
  VisualQuantify,
  defaultVisualQuantifyValue,
  type VisualQuantifyValue,
} from "@/components/VisualQuantify";
import StyleSelector, { type SelectorOption } from "@/components/StyleSelector";
import RichTextEditor from "@/components/RichTextEditor";
import { useModelConfigs } from "@/hooks/useModelConfigs";
import { plainTextToHtml } from "@/lib/html-to-text";
import { BUTTON_BASE } from "@/lib/control-classes";

const PROJECT_KEY = (id: string) => `/api/projects/${id}`;

const inputClass =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder:text-stone-500";
const labelClass =
  "mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300";

/** 将接口返回的字符串转为富文本 HTML（兼容已有纯文本） */
function toEditorHtml(s: string | null | undefined): string {
  if (s == null || s.trim() === "") return "<p></p>";
  if (s.trim().startsWith("<")) return s;
  const html = plainTextToHtml(s);
  return html || "<p></p>";
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.projectId as string | undefined;
  const { data: project, mutate } = useSWR<Project | null>(
    projectId ? PROJECT_KEY(projectId) : null,
    () => (projectId ? fetchProject(projectId) : Promise.resolve(null))
  );

  const [name, setName] = useState("");
  const [storyOverviewHtml, setStoryOverviewHtml] = useState("<p></p>");
  const [prePromptHtml, setPrePromptHtml] = useState("<p></p>");
  const [dialogueQuantify, setDialogueQuantify] =
    useState<DialogueQuantifyValue>(defaultDialogueQuantifyValue);
  const [visualQuantify, setVisualQuantify] = useState<VisualQuantifyValue>(
    defaultVisualQuantifyValue
  );
  const [defaultScriptModelId, setDefaultScriptModelId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { models } = useModelConfigs();
  const modelOptions: SelectorOption[] = models.map((m) => ({
    id: m.id,
    label: m.name,
    description: m.description ?? undefined,
  }));

  useEffect(() => {
    if (!project) return;
    setName(project.name ?? "");
    setStoryOverviewHtml(toEditorHtml(project.storyOverview));
    if (
      project.dialogueQuantify &&
      typeof project.dialogueQuantify === "object"
    ) {
      setDialogueQuantify({
        ...defaultDialogueQuantifyValue,
        ...project.dialogueQuantify,
      } as DialogueQuantifyValue);
    }
    if (project.visualQuantify && typeof project.visualQuantify === "object") {
      setVisualQuantify({
        ...defaultVisualQuantifyValue,
        ...project.visualQuantify,
      } as VisualQuantifyValue);
    }
    setDefaultScriptModelId(project.defaultScriptModelId?.trim() ?? "");
    setPrePromptHtml(toEditorHtml(project.prePrompt));
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setSaveError("项目名称不能为空");
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      const storyOverviewValue =
        storyOverviewHtml.trim() === "" || storyOverviewHtml.trim() === "<p></p>"
          ? null
          : storyOverviewHtml;
      const prePromptValue =
        prePromptHtml.trim() === "" || prePromptHtml.trim() === "<p></p>"
          ? null
          : prePromptHtml;
      const updated = await updateProject(projectId, {
        name: trimmedName,
        storyOverview: storyOverviewValue,
        dialogueQuantify,
        visualQuantify,
        defaultScriptModelId: defaultScriptModelId.trim() || null,
        prePrompt: prePromptValue,
      });
      await mutate(updated, false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (!projectId) {
    return (
      <div className="min-h-full bg-stone-50/50 dark:bg-stone-900/30 p-6">
        <p className="text-stone-500 dark:text-stone-400">缺少项目 ID</p>
        <Link
          href="/project"
          className="mt-2 inline-flex text-amber-600 hover:underline"
        >
          返回项目列表
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-full bg-stone-50/50 dark:bg-stone-900/30 p-6">
        <p className="text-stone-500 dark:text-stone-400">加载中…</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-stone-50/50 dark:bg-stone-900/30">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white px-6 py-4 dark:border-stone-700 dark:bg-stone-800/95">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/project"
              className="flex shrink-0 items-center text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
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
            <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
              项目详情
            </h1>
          </div>
        </div>
      </header>

      <main className="p-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
          <div>
            <label htmlFor="project-name" className={labelClass}>
              项目名称 <span className="text-red-500">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入项目名称"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>故事大纲</label>
            <RichTextEditor
              content={storyOverviewHtml}
              placeholder="简述故事梗概或创作方向"
              onChange={setStoryOverviewHtml}
              className="mt-1"
            />
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">
              台词量化指标
            </h2>
            <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-600 dark:bg-stone-800/80">
              <DialogueQuantify
                value={dialogueQuantify}
                onChange={setDialogueQuantify}
              />
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">
              画面量化指标
            </h2>
            <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-600 dark:bg-stone-800/80">
              <VisualQuantify
                value={visualQuantify}
                onChange={setVisualQuantify}
              />
            </div>
          </div>

          <div>
            <StyleSelector
              label="模型选择"
              options={modelOptions}
              value={defaultScriptModelId}
              onChange={setDefaultScriptModelId}
              placeholder="选择默认剧本创作模型"
            />
          </div>

          <div>
            <label className={labelClass}>前置 prompt</label>
            <RichTextEditor
              content={prePromptHtml}
              placeholder="在剧本/视频生成时拼在系统提示前的固定内容，可选"
              onChange={setPrePromptHtml}
              className="mt-1"
            />
          </div>

          {saveError && (
            <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className={`${BUTTON_BASE} bg-amber-500 text-white transition-colors hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700`}
            >
              {saving ? "保存中…" : "保存"}
            </button>
            <Link
              href={`/project/${projectId}/tasks`}
              className={`${BUTTON_BASE} border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700`}
            >
              返回任务列表
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
