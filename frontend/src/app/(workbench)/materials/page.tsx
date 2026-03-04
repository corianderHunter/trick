"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { BUTTON_BASE } from "@/lib/control-classes";
import { PaintBrushIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  fetchMaterials,
  materialThumbnailUrl,
  deleteMaterial,
  type MaterialListItem,
} from "@/lib/material-api";

/** 物料卡片展示用（thumbnails 为完整 URL） */
type MaterialCard = {
  id: string;
  title: string;
  description: string;
  thumbnails: string[];
};

/** 占位缩略图（无图时显示，填满父容器） */
function PlaceholderThumb({ className }: { className?: string }) {
  return (
    <div
      className={["flex h-full w-full items-center justify-center rounded-lg bg-stone-200 dark:bg-stone-700", className].filter(Boolean).join(" ")}
      aria-hidden
    >
      <svg
        className="size-6 text-stone-400 dark:text-stone-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
}

const MAX_THUMBS = 3;

function MaterialCardItem({
  card,
  onDelete,
}: {
  card: MaterialCard;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const thumbs = card.thumbnails.slice(0, MAX_THUMBS);
  const count = Math.max(1, thumbs.length);
  const gridCols = count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-2" : "grid-cols-3";

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete(card.id);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <article className="group relative flex h-[220px] flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-stone-700 dark:bg-stone-800/80">
      <div className={`grid h-20 shrink-0 ${gridCols} gap-1 p-2`}>
        {count === 1 && thumbs.length === 0 ? (
          <div className="flex h-full min-w-0 items-center justify-center overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-700">
            <PlaceholderThumb />
          </div>
        ) : (
          thumbs.map((src, i) => (
            <div
              key={i}
              className="flex h-full min-w-0 items-center justify-center overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-700"
            >
              <img src={src} alt="" className="h-full w-full object-contain" />
            </div>
          ))
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <h2 className="line-clamp-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
          {card.title || "未命名物料"}
        </h2>
        <p className="mt-1 line-clamp-2 text-xs text-stone-500 dark:text-stone-400">
          {card.description || "暂无描述"}
        </p>
      </div>
      {/* 悬浮操作层 */}
      <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-stone-900/60 opacity-0 transition-opacity group-hover:opacity-100">
        <Link
          href={`/materials/${card.id}`}
          className="rounded-lg p-2.5 text-stone-800 shadow transition-colors hover:bg-white/90 hover:text-stone-900 dark:text-stone-100 dark:hover:bg-white/20"
          title="编辑"
        >
          <PaintBrushIcon className="size-6" />
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className={`flex items-center gap-1.5 rounded-lg p-2.5 shadow transition-colors disabled:opacity-50 ${confirming ? "bg-red-600 text-white hover:bg-red-500" : "text-stone-800 hover:bg-white/90 hover:text-stone-900 dark:text-stone-100 dark:hover:bg-white/20"}`}
          title={confirming ? "确认删除？" : "删除"}
        >
          <TrashIcon className="size-6" />
          {confirming && <span className="text-sm font-medium">确认</span>}
        </button>
        {confirming && (
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-lg p-2.5 text-white/90 hover:bg-white/20"
            title="取消"
          >
            取消
          </button>
        )}
      </div>
    </article>
  );
}

function toCard(item: MaterialListItem): MaterialCard {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? "",
    thumbnails: (item.thumbnails ?? []).map(materialThumbnailUrl),
  };
}

export default function MaterialsPage() {
  const { data: list = [], error, isLoading, mutate } = useSWR(
    "/api/materials",
    fetchMaterials
  );
  const items = list.map(toCard);

  const handleDelete = async (id: string) => {
    await deleteMaterial(id);
    await mutate();
  };

  return (
    <div className="min-h-full bg-stone-50/50 dark:bg-stone-900/30">
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              物料库
            </h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              管理视频创作可用的素材卡片，支持标题、描述与多张缩略图
            </p>
          </div>
          <Link
            href="/materials/new"
            className={`${BUTTON_BASE} inline-flex items-center justify-center gap-2 bg-amber-600 text-white shadow-sm transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900`}
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加物料
          </Link>
        </header>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            {error.message}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-stone-200 bg-white/80 py-16 text-center dark:border-stone-700 dark:bg-stone-900/50">
            <p className="text-sm text-stone-500 dark:text-stone-400">加载中…</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {items.map((card) => (
                <MaterialCardItem
                  key={card.id}
                  card={card}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            {items.length === 0 && (
              <div className="rounded-xl border border-dashed border-stone-200 bg-white/80 py-16 text-center dark:border-stone-700 dark:bg-stone-900/50">
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  暂无物料，添加后将在此展示
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
