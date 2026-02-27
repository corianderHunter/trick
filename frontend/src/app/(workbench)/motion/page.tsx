"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import useSWR from "swr";
import RichTextEditor from "@/components/RichTextEditor";
import StyleSelector, { type SelectorOption } from "@/components/StyleSelector";
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
import { useModelConfigs } from "@/hooks/useModelConfigs";
import {
  fetchEbooks,
  fetchEbookChapters,
  fetchChapterContent,
} from "@/lib/ebook-api";
import { htmlToPlainText, plainTextToHtml } from "@/lib/html-to-text";
import { createGeneration } from "@/lib/generation-api";

export default function MotionPage() {
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

  const [content, setContent] = useState("");
  const [model, setModel] = useState<string>("");
  const [dialogueQuantify, setDialogueQuantify] = useState<DialogueQuantifyValue>(
    defaultDialogueQuantifyValue
  );
  const [visualQuantify, setVisualQuantify] = useState<VisualQuantifyValue>(
    defaultVisualQuantifyValue
  );

  const [selectedEbookId, setSelectedEbookId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [fillingChapter, setFillingChapter] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [contentError, setContentError] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const refContentSection = useRef<HTMLElement>(null);
  const refModelSection = useRef<HTMLElement>(null);

  const { data: ebooks = [] } = useSWR("/api/ebooks", fetchEbooks);
  const { data: ebookChapters = [] } = useSWR(
    selectedEbookId ? ["/api/ebooks", selectedEbookId, "chapters"] : null,
    () => fetchEbookChapters(selectedEbookId)
  );

  const fillFromChapter = useCallback(async () => {
    if (!selectedEbookId || !selectedChapterId) return;
    setFillingChapter(true);
    try {
      const html = await fetchChapterContent(selectedEbookId, selectedChapterId);
      const plain = htmlToPlainText(html);
      const editorHtml = plainTextToHtml(plain);
      setContent(editorHtml);
      setEditorKey((k) => k + 1);
    } catch {
      alert("获取章节内容失败");
    } finally {
      setFillingChapter(false);
    }
  }, [selectedEbookId, selectedChapterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const plain = htmlToPlainText(content).trim();
    const contentValid = plain.length >= 500;
    const modelValid = !!model.trim();

    if (!contentValid) {
      setContentError(
        plain.length === 0
          ? "请输入正文内容"
          : `正文不少于 500 字，当前 ${plain.length} 字`
      );
      setModelError(null);
      refContentSection.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!modelValid) {
      setContentError(null);
      setModelError("请选择生成模型");
      refModelSection.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setContentError(null);
    setModelError(null);
    setSubmitError(null);
    setSubmitting(true);
    try {
      await createGeneration({
        content: plain,
        modelId: model,
        dialogueQuantify: {
          rhetoricalDensity: dialogueQuantify.rhetoricalDensity,
          emotionalExplicitness: dialogueQuantify.emotionalExplicitness,
          dramaticTension: dialogueQuantify.dramaticTension,
          rhythmStructure: dialogueQuantify.rhythmStructure,
          registerLevel: dialogueQuantify.registerLevel,
          narrativeExplicitness: dialogueQuantify.narrativeExplicitness,
        },
        visualQuantify: {
          colorSaturation: visualQuantify.colorSaturation,
          compositionSymmetry: visualQuantify.compositionSymmetry,
          cameraMovement: visualQuantify.cameraMovement,
          lightShadowIntensity: visualQuantify.lightShadowIntensity,
          depthOfField: visualQuantify.depthOfField,
          sceneType: visualQuantify.sceneType,
        },
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-linear-to-br from-stone-50 via-amber-50/30 to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
            TRICK
          </h1>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            输入您的文本内容，选择风格与模型，开始创作
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section
            ref={refContentSection}
            className={`rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur dark:bg-stone-900/80 ${contentError ? "ring-2 ring-red-400 dark:ring-red-500" : ""}`}
          >
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-stone-800 dark:text-stone-200">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                1
              </span>
              文本内容
            </h2>
            <div className="mb-4 rounded-xl border border-stone-200 bg-stone-50/50 p-4 dark:border-stone-600 dark:bg-stone-800/50">
              <p className="mb-3 text-sm font-medium text-stone-600 dark:text-stone-400">
                从电子书选择章节
              </p>
              <div className="mb-3">
                <span className="mb-2 block text-xs font-medium text-stone-500 dark:text-stone-400">
                  选择电子书
                </span>
                {ebooks.length === 0 ? (
                  <p className="text-sm text-stone-400 dark:text-stone-500">
                    暂无电子书，请先在
                    <a href="/ebooks" className="ml-1 text-amber-600 hover:underline dark:text-amber-400">
                      电子书页
                    </a>
                    上传
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {ebooks.map((ebook) => (
                      <li key={ebook.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEbookId(ebook.id);
                            setSelectedChapterId("");
                          }}
                          className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${selectedEbookId === ebook.id
                            ? "border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-100"
                            : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                            }`}
                        >
                          <span className="font-medium">{ebook.title || ebook.filename}</span>
                          {ebook.author && (
                            <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">
                              {ebook.author}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {selectedEbookId && (
                <div>
                  <span className="mb-2 block text-xs font-medium text-stone-500 dark:text-stone-400">
                    章节目录
                  </span>
                  {ebookChapters.length === 0 ? (
                    <p className="text-sm text-stone-400 dark:text-stone-500">加载目录中…</p>
                  ) : (
                    <div className="flex flex-col gap-1 rounded-lg border border-stone-200 bg-white dark:border-stone-600 dark:bg-stone-800">
                      <ul className="max-h-52 overflow-y-auto py-1">
                        {ebookChapters.map((ch) => (
                          <li key={ch.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedChapterId(ch.id)}
                              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${selectedChapterId === ch.id
                                ? "bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100"
                                : "text-stone-700 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-700"
                                }`}
                            >
                              <span className="min-w-10 shrink-0 text-stone-400 dark:text-stone-500">
                                {ch.chapterIndex + 1}.
                              </span>
                              <span className="min-w-0 flex-1 truncate">
                                {ch.title || `第 ${ch.chapterIndex + 1} 章`}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-stone-100 px-3 py-2 dark:border-stone-700">
                        <button
                          type="button"
                          onClick={fillFromChapter}
                          disabled={!selectedChapterId || fillingChapter}
                          className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700"
                        >
                          {fillingChapter ? "填入中…" : "将选中章节填入正文"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <RichTextEditor
              key={editorKey}
              content={content}
              onChange={(html) => {
                setContent(html);
                setContentError(null);
              }}
              placeholder="在此输入或粘贴您的文本，或从上方选择电子书章节填入；支持标题、加粗、列表等格式（不少于 500 字）..."
            />
            {contentError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{contentError}</p>
            )}
          </section>

          <section className="rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur dark:bg-stone-900/80">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-stone-800 dark:text-stone-200">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                2
              </span>
              台词量化
            </h2>
            <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
              从修辞密度、情绪显性度、戏剧张力、节奏结构、语域层级、叙事显性度等维度调节台词风格
            </p>
            <DialogueQuantify value={dialogueQuantify} onChange={setDialogueQuantify} />
          </section>

          <section className="rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur dark:bg-stone-900/80">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-stone-800 dark:text-stone-200">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                3
              </span>
              画面量化
            </h2>
            <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
              色彩饱和度、构图对称性、镜头运动、光影强度、景深感、场景类型等维度调节画面风格
            </p>
            <VisualQuantify value={visualQuantify} onChange={setVisualQuantify} />
          </section>

          <section
            ref={refModelSection}
            className={`rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur dark:bg-stone-900/80 ${modelError ? "ring-2 ring-red-400 dark:ring-red-500" : ""}`}
          >
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-stone-800 dark:text-stone-200">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                4
              </span>
              模型配置
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <StyleSelector
                label="模型选择"
                options={modelOptions}
                value={model}
                onChange={(id) => {
                  setModel(id);
                  setModelError(null);
                }}
                placeholder="选择生成模型"
              />
            </div>
            {modelError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{modelError}</p>
            )}
          </section>

          <div className="flex flex-col items-end gap-2">
            {submitError && (
              <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-amber-500 px-8 py-3 font-medium text-white shadow-md transition-all hover:bg-amber-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed dark:focus:ring-offset-stone-900"
            >
              {submitting ? "提交中…" : "开始生成"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
