"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { fetchProject, type Project } from "@/lib/project-api";
import {
  fetchProjectTasks,
  createProjectTask,
  getPhaseStatusLabel,
  getScriptStatusLabel,
  getScriptModelCallStatusLabel,
  type ProjectTask,
  type PhaseStatus,
  type ScriptModelCallStatus,
} from "@/lib/project-task-api";

const TASKS_KEY = (projectId: string) => `/api/projects/${projectId}/tasks`;

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function StatusBadge({ status, labelFn = getPhaseStatusLabel }: { status: PhaseStatus; labelFn?: (s: PhaseStatus) => string }) {
  const label = labelFn(status);
  const style =
    status === "completed"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : status === "in_progress"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
        : "bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-400";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}

function ScriptModelCallBadge({ status }: { status: ScriptModelCallStatus | null | undefined }) {
  const s = status ?? "not_called";
  const label = getScriptModelCallStatusLabel(s);
  const style =
    s === "completed"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
      : s === "calling"
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
        : s === "failed"
          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
          : "bg-stone-100 text-stone-500 dark:bg-stone-700 dark:text-stone-400";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}

function TaskActions({
  projectId,
  task,
}: {
  projectId: string;
  task: ProjectTask;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/project/${projectId}/tasks/${task.id}/script`}
        className="rounded border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-700"
      >
        剧本创作
      </Link>
      <Link
        href={`/project/${projectId}/tasks/${task.id}/video`}
        className="rounded border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-700"
      >
        视频创作
      </Link>
    </div>
  );
}

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params?.projectId as string | undefined;

  const { data: project, isLoading: projectLoading } = useSWR<Project | null>(
    projectId ? `/api/projects/${projectId}` : null,
    () => (projectId ? fetchProject(projectId) : Promise.resolve(null))
  );

  const { data: tasks = [], isLoading: tasksLoading, mutate } = useSWR<ProjectTask[]>(
    projectId ? TASKS_KEY(projectId) : null,
    () => (projectId ? fetchProjectTasks(projectId) : Promise.resolve([]))
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateTask = useCallback(async () => {
    const name = newTaskName.trim();
    if (!name || !projectId) return;
    setCreateError(null);
    setCreating(true);
    try {
      await createProjectTask(projectId, { name });
      await mutate();
      setNewTaskName("");
      setCreateOpen(false);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setCreating(false);
    }
  }, [projectId, newTaskName, mutate]);

  if (!projectId) {
    return (
      <div className="min-h-full bg-stone-50/50 dark:bg-stone-900/30 p-6">
        <p className="text-stone-500 dark:text-stone-400">缺少项目 ID</p>
        <Link href="/project" className="mt-2 inline-flex items-center text-amber-600 hover:underline" aria-label="Back">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
        </Link>
      </div>
    );
  }

  const isLoading = projectLoading || tasksLoading;

  return (
    <div className="min-h-full bg-stone-50/50 dark:bg-stone-900/30">
      <div className="border-b border-stone-200 bg-white px-6 py-4 dark:border-stone-700 dark:bg-stone-800/80">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/project"
              className="flex items-center text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
              aria-label="Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
              </svg>
            </Link>
            <span className="text-stone-400 dark:text-stone-500">/</span>
            <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
              {project ? project.name : "…"} — 任务列表
            </h1>
          </div>
          <button
            type="button"
            onClick={() => { setCreateOpen(true); setCreateError(null); setNewTaskName(""); }}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            新建任务
          </button>
        </div>
      </div>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-stone-900/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto w-full max-w-sm rounded-xl bg-white p-6 shadow-lg dark:bg-stone-800">
            <DialogTitle className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              新建任务
            </DialogTitle>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                任务名称
              </label>
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="输入任务名称"
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder:text-stone-500"
              />
              {createError && (
                <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-700"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCreateTask}
                disabled={creating || !newTaskName.trim()}
                className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700"
              >
                {creating ? "创建中…" : "创建"}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <div className="p-6">
        {isLoading ? (
          <p className="text-stone-500 dark:text-stone-400">加载中…</p>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-white dark:border-stone-600 dark:bg-stone-800/80 overflow-hidden">
            {tasks.length === 0 ? (
              <div className="px-6 py-12 text-center text-stone-500 dark:text-stone-400">
                暂无任务，点击右上角「新建任务」添加
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/80 dark:border-stone-600 dark:bg-stone-800/80">
                      <th className="px-4 py-3 font-medium text-stone-700 dark:text-stone-300">
                        任务名称
                      </th>
                      <th className="px-4 py-3 font-medium text-stone-700 dark:text-stone-300">
                        创建时间
                      </th>
                      <th className="px-4 py-3 font-medium text-stone-700 dark:text-stone-300">
                        剧本创作
                      </th>
                      <th className="px-4 py-3 font-medium text-stone-700 dark:text-stone-300">
                        视频创作
                      </th>
                      <th className="px-4 py-3 font-medium text-stone-700 dark:text-stone-300 text-right">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr
                        key={task.id}
                        className="border-b border-stone-100 dark:border-stone-700 last:border-0"
                      >
                        <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">
                          {task.name}
                        </td>
                        <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                          {formatDate(task.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge status={task.scriptStatus} labelFn={getScriptStatusLabel} />
                            <ScriptModelCallBadge status={task.scriptModelCallStatus} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={task.videoStatus} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <TaskActions projectId={projectId} task={task} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
