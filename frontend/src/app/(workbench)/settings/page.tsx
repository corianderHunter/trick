"use client";

import Link from "next/link";
import { useModelConfigs } from "@/hooks/useModelConfigs";
import { useDialogueStyles } from "@/hooks/useDialogueStyles";
import { useVisualStyles } from "@/hooks/useVisualStyles";

function SettingsCard({
  href,
  title,
  count,
  isLoading,
}: {
  href: string;
  title: string;
  count: number;
  isLoading: boolean;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-stone-200 bg-white/80 p-6 shadow-sm backdrop-blur transition-all hover:border-amber-300 hover:shadow-md dark:border-stone-700 dark:bg-stone-900/80 dark:hover:border-amber-600"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
            {title}
          </h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {isLoading ? "加载中..." : <>已添加 {count} 个</>}
          </p>
        </div>
        <svg
          className="h-5 w-5 text-stone-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}

export default function SettingsPage() {
  const { models, isLoading: modelsLoading } = useModelConfigs();
  const { styles: dialogueStyles, isLoading: dialogueLoading } =
    useDialogueStyles();
  const { styles: visualStyles, isLoading: visualLoading } = useVisualStyles();

  return (
    <div className="min-h-screen bg-linear-to-br from-stone-50 via-amber-50/30 to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <header className="mb-10">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            设置
          </h1>
          <p className="mt-1 text-stone-600 dark:text-stone-400">
            管理模型、台词风格与画面风格
          </p>
        </header>

        <div className="space-y-4">
          <SettingsCard
            href="/settings/models"
            title="模型管理"
            count={models.length}
            isLoading={modelsLoading}
          />
          <SettingsCard
            href="/settings/dialogue-styles"
            title="台词风格"
            count={dialogueStyles.length}
            isLoading={dialogueLoading}
          />
          <SettingsCard
            href="/settings/visual-styles"
            title="画面风格"
            count={visualStyles.length}
            isLoading={visualLoading}
          />
        </div>
      </div>
    </div>
  );
}
