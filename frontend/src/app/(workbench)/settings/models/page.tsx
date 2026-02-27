"use client";

import { useState } from "react";
import Link from "next/link";
import { useModelConfigs } from "@/hooks/useModelConfigs";
import ModelFormModal from "@/components/ModelFormModal";
import type { ModelConfig } from "@/lib/model-config-api";

export default function ModelListPage() {
  const { models, isLoading, create, update, remove } = useModelConfigs();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingModel(null);
    setModalOpen(true);
  };

  const handleEdit = (model: ModelConfig) => {
    setEditingModel(model);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingModel(null);
  };

  const handleSubmit = async (data: {
    name: string;
    apiUrl: string;
    apiKey?: string;
    description?: string;
    provider?: string;
  }) => {
    if (editingModel) {
      await update(editingModel.id, data);
    } else {
      if (!data.apiKey) throw new Error("API 密钥不能为空");
      await create({
        name: data.name,
        apiUrl: data.apiUrl,
        apiKey: data.apiKey,
        description: data.description,
        provider: data.provider,
      });
    }
  };

  const handleDelete = async (model: ModelConfig) => {
    if (!confirm(`确定要删除模型「${model.name}」吗？`)) return;
    setDeletingId(model.id);
    try {
      await remove(model.id);
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
                模型管理
              </h1>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                已添加 {models.length} 个模型
              </p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="rounded-xl bg-amber-500 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-amber-600"
          >
            新增模型
          </button>
        </header>

        {isLoading ? (
          <div className="rounded-2xl bg-white/80 p-12 text-center dark:bg-stone-900/80">
            <p className="text-stone-500 dark:text-stone-400">加载中...</p>
          </div>
        ) : models.length === 0 ? (
          <div className="rounded-2xl bg-white/80 p-12 text-center dark:bg-stone-900/80">
            <p className="mb-4 text-stone-500 dark:text-stone-400">
              暂无模型配置，请先添加模型
            </p>
            <button
              onClick={handleCreate}
              className="rounded-xl bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600"
            >
              新增模型
            </button>
          </div>
        ) : (
          <ul className="space-y-4">
            {models.map((model) => (
              <li
                key={model.id}
                className="rounded-2xl border border-stone-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-stone-700 dark:bg-stone-900/80"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                      {model.name}
                      {model.provider && (
                        <span className="ml-2 text-xs font-normal text-stone-500 dark:text-stone-400">
                          ({model.provider})
                        </span>
                      )}
                    </h3>
                    {model.description && (
                      <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                        {model.description}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                      {model.apiUrl}
                    </p>
                    <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                      API Key: {model.apiKey?.slice(0, 8) ?? "***"}***
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => handleEdit(model)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-100"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(model)}
                      disabled={deletingId === model.id}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                    >
                      {deletingId === model.id ? "删除中..." : "删除"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ModelFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={editingModel}
      />
    </div>
  );
}
