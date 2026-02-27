"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

type StyleItem = {
  id: string;
  name: string;
  description?: string | null;
  sortOrder: number;
};

type StyleFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    sortOrder?: number;
  }) => Promise<void>;
  initialData?: StyleItem | null;
  title: string;
};

export default function StyleFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  title,
}: StyleFormModalProps) {
  const isEdit = !!initialData;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setDescription(initialData?.description ?? "");
      setSortOrder(initialData?.sortOrder ?? 0);
      setError("");
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (!name.trim()) {
        setError("请填写名称");
        return;
      }
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        sortOrder,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-stone-900">
          <DialogTitle className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            {isEdit ? `编辑${title}` : `新增${title}`}
          </DialogTitle>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </p>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                placeholder="如：日常口语"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                说明
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                placeholder="轻松自然的对话风格"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                排序序号
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(parseInt(e.target.value, 10) || 0)
                }
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                min={0}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-stone-200 px-4 py-2 font-medium text-stone-700 transition-colors hover:bg-stone-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
              >
                {submitting ? "提交中..." : "确定"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
