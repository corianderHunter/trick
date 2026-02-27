"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function TaskVideoPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const taskId = params?.taskId as string;

  return (
    <div className="min-h-full bg-stone-50/50 dark:bg-stone-900/30 p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/project/${projectId}/tasks`}
          className="flex items-center text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          aria-label="Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
        </Link>
        <span className="text-stone-400 dark:text-stone-500">/</span>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
          视频创作
        </h1>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-600 dark:bg-stone-800/80">
        <p className="text-stone-500 dark:text-stone-400">
          视频创作功能开发中（任务 ID：{taskId}）
        </p>
      </div>
    </div>
  );
}
