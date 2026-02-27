"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import {
  fetchEbooks,
  uploadEbook,
  deleteEbook,
  fetchEbookChapters,
  fetchChapterContent,
  type Ebook,
  type EbookChapter,
} from "@/lib/ebook-api";
import { htmlToPlainText } from "@/lib/html-to-text";

const EBOOKS_KEY = "/api/ebooks";

export default function EbooksPage() {
  const { data: ebooks = [], mutate } = useSWR(EBOOKS_KEY, fetchEbooks);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedEbook, setSelectedEbook] = useState<Ebook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<EbookChapter | null>(null);
  const [chapterContent, setChapterContent] = useState<string>("");
  const [loadingContent, setLoadingContent] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: chapters = [], isLoading: chaptersLoading } = useSWR(
    selectedEbook ? [EBOOKS_KEY, selectedEbook.id, "chapters"] : null,
    () => fetchEbookChapters(selectedEbook!.id)
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".epub")) {
        setUploadError("请选择 .epub 文件");
        return;
      }
      setUploadError(null);
      setUploading(true);
      try {
        await uploadEbook(file);
        await mutate();
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "上传失败");
      } finally {
        setUploading(false);
      }
    },
    [mutate]
  );

  const onSelectChapter = useCallback(
    async (ch: EbookChapter) => {
      if (!selectedEbook) return;
      setSelectedChapter(ch);
      setLoadingContent(true);
      setChapterContent("");
      try {
        const content = await fetchChapterContent(selectedEbook.id, ch.id);
        setChapterContent(content);
      } catch {
        setChapterContent("<p>加载失败</p>");
      } finally {
        setLoadingContent(false);
      }
    },
    [selectedEbook]
  );

  const selectEbook = useCallback((ebook: Ebook) => {
    setSelectedEbook(ebook);
    setSelectedChapter(null);
    setChapterContent("");
  }, []);

  const handleDelete = useCallback(
    async (e: React.MouseEvent, ebook: Ebook) => {
      e.stopPropagation();
      if (!confirm(`确定删除《${ebook.title || ebook.filename}》？`)) return;
      setDeletingId(ebook.id);
      try {
        await deleteEbook(ebook.id);
        if (selectedEbook?.id === ebook.id) {
          setSelectedEbook(null);
          setSelectedChapter(null);
          setChapterContent("");
        }
        await mutate();
      } catch (err) {
        alert(err instanceof Error ? err.message : "删除失败");
      } finally {
        setDeletingId(null);
      }
    },
    [selectedEbook, mutate]
  );

  const handleCopy = useCallback(async () => {
    const text = htmlToPlainText(chapterContent);
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("复制失败");
    }
  }, [chapterContent]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold text-stone-900 dark:text-stone-100">
          EPUB 电子书
        </h1>

        {/* 上传 */}
        <section className="mb-8">
          <label className="block cursor-pointer rounded-xl border-2 border-dashed border-stone-300 bg-white p-8 text-center transition-colors hover:border-amber-400 hover:bg-amber-50/50 dark:border-stone-600 dark:bg-stone-800 dark:hover:border-amber-500 dark:hover:bg-amber-900/20">
            <input
              type="file"
              accept=".epub,application/epub+zip"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <span className="text-stone-600 dark:text-stone-400">
              {uploading ? "上传中…" : "点击或拖拽 .epub 文件到此处上传"}
            </span>
          </label>
          {uploadError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{uploadError}</p>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* 书籍 + 章节列表 */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              已上传书籍
            </h2>
            {ebooks.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">暂无电子书，请先上传</p>
            ) : (
              <ul className="space-y-2">
                {ebooks.map((ebook) => (
                  <li key={ebook.id}>
                    <div
                      className={`flex items-start gap-2 rounded-lg border px-4 py-3 transition-colors ${selectedEbook?.id === ebook.id
                        ? "border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-900/30"
                        : "border-stone-200 bg-white dark:border-stone-600 dark:bg-stone-800"
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => selectEbook(ebook)}
                        className="min-w-0 flex-1 text-left text-sm"
                      >
                        <span className="font-medium text-stone-900 dark:text-stone-100">
                          {ebook.title || ebook.filename}
                        </span>
                        {ebook.author && (
                          <span className="mt-1 block text-xs text-stone-500 dark:text-stone-400">
                            {ebook.author}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, ebook)}
                        disabled={deletingId === ebook.id}
                        className="shrink-0 rounded p-1.5 text-stone-400 hover:bg-red-100 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        title="删除"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {selectedEbook && (
              <>
                <h2 className="mt-6 text-sm font-semibold text-stone-700 dark:text-stone-300">
                  目录
                </h2>
                {chaptersLoading ? (
                  <p className="text-sm text-stone-500">加载目录中…</p>
                ) : chapters.length === 0 ? (
                  <p className="text-sm text-stone-500">无章节信息</p>
                ) : (
                  <ul className="max-h-80 space-y-1 overflow-y-auto rounded-lg border border-stone-200 bg-white dark:border-stone-600 dark:bg-stone-800">
                    {chapters.map((ch) => (
                      <li key={ch.id}>
                        <button
                          type="button"
                          onClick={() => onSelectChapter(ch)}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors ${selectedChapter?.id === ch.id
                            ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                            : "text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700"
                            }`}
                        >
                          {ch.title || `第 ${ch.chapterIndex + 1} 章`}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* 章节正文 */}
          <div className="min-h-[400px] rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-600 dark:bg-stone-800">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                章节正文
              </h2>
              {selectedChapter && !loadingContent && chapterContent.trim() && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-400 dark:hover:bg-stone-600 dark:hover:text-stone-100"
                >
                  {copied ? (
                    "已复制"
                  ) : (
                    <>
                      <CopyIcon />
                      复制为纯文本
                    </>
                  )}
                </button>
              )}
            </div>
            {!selectedChapter && (
              <p className="text-stone-500 dark:text-stone-400">
                请在左侧选择书籍与章节
              </p>
            )}
            {selectedChapter && loadingContent && (
              <p className="text-stone-500">加载中…</p>
            )}
            {selectedChapter && !loadingContent && (
              <article
                className="prose prose-stone max-w-none dark:prose-invert prose-p:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: chapterContent }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}
