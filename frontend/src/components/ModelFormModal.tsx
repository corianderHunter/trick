"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import type { ModelConfig } from "@/lib/model-config-api";

type ModelFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    apiUrl: string;
    apiKey?: string;
    description?: string;
    provider?: string;
  }) => Promise<void>;
  initialData?: ModelConfig | null;
};

export default function ModelFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
}: ModelFormModalProps) {
  const isEdit = !!initialData;
  const [name, setName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState("deepseek");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setApiUrl(initialData?.apiUrl ?? "");
      setApiKey("");
      setDescription(initialData?.description ?? "");
      setProvider(initialData?.provider ?? "deepseek");
      setError("");
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (!name.trim() || !apiUrl.trim() || (!isEdit && !apiKey.trim())) {
        setError("请填写必填项");
        return;
      }
      const payload: {
        name: string;
        apiUrl: string;
        apiKey?: string;
        description?: string;
        provider?: string;
      } = {
        name: name.trim(),
        apiUrl: apiUrl.trim(),
        description: description.trim() || undefined,
        provider: provider.trim() || undefined,
      };
      if (!isEdit || apiKey.trim()) {
        payload.apiKey = apiKey.trim();
      }
      await onSubmit(payload);
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
            {isEdit ? "编辑模型" : "新增模型"}
          </DialogTitle>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </p>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                模型名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                placeholder="如：GPT-4o"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                提供商
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
              >
                <option value="deepseek">DeepSeek</option>
                <option value="openai">OpenAI（兼容）</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                API 地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                placeholder={
                  provider === "deepseek"
                    ? "https://api.deepseek.com"
                    : "https://api.openai.com/v1"
                }
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                API 密钥 {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                placeholder={isEdit ? "留空则不修改" : "sk-xxx"}
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
                placeholder="多模态大模型，综合能力强"
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
