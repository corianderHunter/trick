"use client";

import Link from "next/link";
import useSWR from "swr";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { fetchProjects, type Project } from "@/lib/project-api";

const PROJECTS_KEY = "/api/projects";

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

export default function ProjectPage() {
  const { data: projects = [], isLoading } = useSWR(PROJECTS_KEY, fetchProjects);

  return (
    <div className="min-h-full bg-stone-50/50 dark:bg-stone-900/30">
      <div className="border-b border-stone-200 bg-white px-6 py-4 dark:border-stone-700 dark:bg-stone-800/80">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            项目
          </h1>
          <Link
            href="/project/new"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            新建项目
          </Link>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <p className="text-stone-500 dark:text-stone-400">加载中…</p>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-white py-16 dark:border-stone-600 dark:bg-stone-800/50">
            <p className="text-stone-500 dark:text-stone-400">暂无项目</p>
            <p className="mt-1 text-sm text-stone-400 dark:text-stone-500">
              点击「新建项目」创建第一个项目
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <li>
      <article className="relative flex h-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-stone-600 dark:bg-stone-800">
        <Link
          href={`/project/${project.id}`}
          className="absolute right-3 top-3 z-10 rounded p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-700 dark:hover:text-stone-300"
          aria-label="项目详情"
        >
          <Cog6ToothIcon className="size-5" />
        </Link>
        <Link href={`/project/${project.id}/tasks`} className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col p-4">
            <div className="flex items-start justify-between gap-2 pr-8">
              <h2 className="font-semibold text-stone-900 dark:text-stone-100">
                {project.name}
              </h2>
              <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                {project.progress}%
              </span>
            </div>
            {(project.originalWork ?? "").trim() && (
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                原著：{project.originalWork}
              </p>
            )}
            {(project.storyOverview ?? "").trim() && (
              <p className="mt-2 line-clamp-3 text-sm text-stone-600 dark:text-stone-300">
                {project.storyOverview}
              </p>
            )}
            {((project.fixedMaterials ?? []) as string[]).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {((project.fixedMaterials ?? []) as string[]).slice(0, 4).map((m, i) => (
                  <span
                    key={i}
                    className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-600 dark:bg-stone-700 dark:text-stone-400"
                  >
                    {m}
                  </span>
                ))}
                {((project.fixedMaterials ?? []) as string[]).length > 4 && (
                  <span className="text-xs text-stone-400">
                    +{(project.fixedMaterials as string[]).length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="border-t border-stone-100 px-4 py-2 text-xs text-stone-500 dark:border-stone-700 dark:text-stone-400">
            <span>创建 {formatDate(project.createdAt)}</span>
            {project.lastWorkedAt && (
              <>
                <span className="mx-2">·</span>
                <span>最近 {formatDate(project.lastWorkedAt)}</span>
              </>
            )}
          </div>
        </Link>
      </article>
    </li>
  );
}
