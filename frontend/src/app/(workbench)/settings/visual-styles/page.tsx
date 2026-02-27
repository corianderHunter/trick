"use client";

import { useState } from "react";
import Link from "next/link";
import { useVisualStyles } from "@/hooks/useVisualStyles";
import StyleFormModal from "@/components/StyleFormModal";
import type { VisualStyle } from "@/lib/visual-style-api";

export default function VisualStylesPage() {
  const { styles, isLoading, create, update, remove } = useVisualStyles();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VisualStyle | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: VisualStyle) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (data: {
    name: string;
    description?: string;
    sortOrder?: number;
  }) => {
    if (editingItem) {
      await update(editingItem.id, data);
    } else {
      await create(data);
    }
  };

  const handleDelete = async (item: VisualStyle) => {
    if (!confirm(`确定要删除「${item.name}」吗？`)) return;
    setDeletingId(item.id);
    try {
      await remove(item.id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-stone-50 via-amber-50/30 to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
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
                画面风格管理
              </h1>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                已添加 {styles.length} 个画面风格
              </p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="rounded-xl bg-amber-500 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-amber-600"
          >
            新增
          </button>
        </header>

        {isLoading ? (
          <div className="rounded-2xl bg-white/80 p-12 text-center dark:bg-stone-900/80">
            <p className="text-stone-500 dark:text-stone-400">加载中...</p>
          </div>
        ) : styles.length === 0 ? (
          <div className="rounded-2xl bg-white/80 p-12 text-center dark:bg-stone-900/80">
            <p className="mb-4 text-stone-500 dark:text-stone-400">
              暂无画面风格，请先添加
            </p>
            <button
              onClick={handleCreate}
              className="rounded-xl bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600"
            >
              新增
            </button>
          </div>
        ) : (
          <ul className="space-y-4">
            {styles.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-stone-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-stone-700 dark:bg-stone-900/80"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                        {item.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                      排序: {item.sortOrder}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      {deletingId === item.id ? "删除中..." : "删除"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <StyleFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={editingItem}
        title="画面风格"
      />
    </div>
  );
}
