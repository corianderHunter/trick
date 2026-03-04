"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import { BUTTON_BASE, INPUT_BASE } from "@/lib/control-classes";
import {
  fetchMaterial,
  uploadMaterialImage,
  updateMaterial,
  materialThumbnailUrl,
} from "@/lib/material-api";

/** 编辑页图片项：既有可能是已有图（filePath+displayUrl），也可能是新上传（file+preview，保存时上传得 filePath） */
type ImageItem = {
  filePath: string;
  displayUrl: string;
  description: string;
  file?: File | null;
};

function toImageItems(images: Array<{ url: string; description: string | null }>): ImageItem[] {
  return images.map((img) => ({
    filePath: img.url.split("/").pop() || "",
    displayUrl: materialThumbnailUrl(img.url),
    description: img.description ?? "",
    file: null,
  }));
}

export default function EditMaterialPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { data: detail, error: loadError, isLoading, mutate } = useSWR(
    id ? ["material", id] : null,
    () => fetchMaterial(id!)
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (detail) {
      setTitle(detail.title);
      setDescription(detail.description ?? "");
      setImages(
        detail.images?.length
          ? toImageItems(detail.images)
          : [{ filePath: "", displayUrl: "", description: "", file: null }]
      );
    }
  }, [detail]);

  const addImage = useCallback(() => {
    setImages((prev) => [
      ...prev,
      { filePath: "", displayUrl: "", description: "", file: null },
    ]);
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0)
        next.push({ filePath: "", displayUrl: "", description: "", file: null });
      return next;
    });
  }, []);

  const setImageFile = useCallback((index: number, file: File | null) => {
    setImages((prev) => {
      const next = [...prev];
      const prevItem = next[index];
      if (prevItem.file && prevItem.displayUrl.startsWith("blob:"))
        URL.revokeObjectURL(prevItem.displayUrl);
      const displayUrl = file
        ? URL.createObjectURL(file)
        : prevItem.filePath
          ? materialThumbnailUrl(prevItem.filePath)
          : "";
      next[index] = {
        ...prevItem,
        file: file ?? undefined,
        displayUrl,
        filePath: prevItem.filePath,
      };
      return next;
    });
  }, []);

  const setImageDescription = useCallback((index: number, description: string) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], description };
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!id) return;
      setSubmitError(null);
      setSubmitting(true);
      try {
        const payload: { url: string; description: string }[] = [];
        for (const item of images) {
          if (item.file) {
            const { url } = await uploadMaterialImage(item.file);
            payload.push({ url, description: item.description.trim() });
          } else if (item.filePath) {
            payload.push({ url: item.filePath, description: item.description.trim() });
          }
        }
        await updateMaterial(id, {
          title: title.trim() || "未命名物料",
          description: description.trim() || "",
          images: payload,
        });
        await mutate();
        router.push("/materials");
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "保存失败");
      } finally {
        setSubmitting(false);
      }
    },
    [id, title, description, images, mutate, router]
  );

  if (!id) {
    return (
      <div className="min-h-full bg-stone-50/50 dark:bg-stone-900/30 px-4 py-8">
        <p className="text-sm text-stone-500">无效的物料 ID</p>
        <Link href="/materials" className="mt-2 text-sm text-amber-600 hover:underline">
          返回物料库
        </Link>
      </div>
    );
  }

  if (isLoading || !detail) {
    return (
      <div className="min-h-full bg-stone-50/50 dark:bg-stone-900/30 px-4 py-8">
        <p className="text-sm text-stone-500">{isLoading ? "加载中…" : "未找到该物料"}</p>
        <Link href="/materials" className="mt-2 text-sm text-amber-600 hover:underline">
          返回物料库
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-full bg-stone-50/50 dark:bg-stone-900/30 px-4 py-8">
        <p className="text-sm text-red-600 dark:text-red-400">{loadError.message}</p>
        <Link href="/materials" className="mt-2 text-sm text-amber-600 hover:underline">
          返回物料库
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-stone-50/50 dark:bg-stone-900/30">
      <div className="border-b border-stone-200 bg-white px-6 py-4 dark:border-stone-700 dark:bg-stone-800/80">
        <div className="flex items-center gap-4">
          <Link
            href="/materials"
            className="flex items-center text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
            aria-label="返回物料库"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-stone-400 dark:text-stone-500">/</span>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            编辑物料
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="space-y-8">
          <section className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-600 dark:bg-stone-800/80">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
                标题
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入物料标题"
                className={INPUT_BASE}
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
                描述
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入物料描述"
                rows={3}
                className={INPUT_BASE}
              />
            </label>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-600 dark:bg-stone-800/80">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
                图片（可上传多张，每张可填描述）
              </h2>
              <button
                type="button"
                onClick={addImage}
                className={`${BUTTON_BASE} text-amber-600 hover:bg-amber-50 dark:hover:bg-stone-800`}
              >
                添加图片
              </button>
            </div>

            <ul className="mt-4 space-y-4">
              {images.map((item, index) => (
                <li
                  key={index}
                  className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-stone-50/80 p-4 dark:border-stone-600 dark:bg-stone-800/50 sm:flex-row sm:items-start"
                >
                  <div className="flex shrink-0 items-center gap-3">
                    <label className="relative block h-20 w-28 cursor-pointer overflow-hidden rounded-lg border border-dashed border-stone-300 bg-stone-100 dark:border-stone-600 dark:bg-stone-700">
                      {item.displayUrl ? (
                        <img
                          src={item.displayUrl}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs text-stone-400 dark:text-stone-500">
                          点击上传
                        </span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          setImageFile(index, f ?? null);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className={`${BUTTON_BASE} shrink-0 rounded-lg p-2.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 dark:hover:bg-stone-600 dark:hover:text-stone-200`}
                      title="删除该图片"
                    >
                      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <label className="min-w-0 flex-1">
                    <span className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">
                      该图描述（选填）
                    </span>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => setImageDescription(index, e.target.value)}
                      placeholder="这张图片的说明"
                      className={INPUT_BASE}
                    />
                  </label>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {submitError && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{submitError}</p>
        )}

        <div className="mt-8 flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className={`${BUTTON_BASE} bg-amber-600 text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-stone-900`}
          >
            {submitting ? "保存中…" : "保存"}
          </button>
          <Link
            href="/materials"
            className={`${BUTTON_BASE} border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700`}
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
