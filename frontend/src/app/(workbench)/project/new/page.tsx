"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  fetchEbooks,
  uploadEbook,
  fetchEbookChapters,
  type Ebook,
} from "@/lib/ebook-api";
import { createProject } from "@/lib/project-api";

const EBOOKS_KEY = "/api/ebooks";
const PROJECTS_KEY = "/api/projects";

type Step1Data = {
  name: string;
  ebook: Ebook | null;
};

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Data>({ name: "", ebook: null });
  const [materials, setMaterials] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: ebooks = [], mutate: mutateEbooks } = useSWR(EBOOKS_KEY, fetchEbooks);
  const { mutate: mutateProjects } = useSWR(PROJECTS_KEY, () => Promise.resolve([]));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const canNext =
    step1Data.name.trim() !== "" && step1Data.ebook !== null;

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".epub")) {
        setUploadError("请选择 .epub 文件");
        return;
      }
      setUploadError(null);
      setUploading(true);
      try {
        const created = await uploadEbook(file);
        await mutateEbooks();
        setStep1Data((d) => ({ ...d, ebook: created }));
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "上传失败");
      } finally {
        setUploading(false);
      }
    },
    [mutateEbooks]
  );

  const handleCreate = useCallback(async () => {
    const fixedMaterials = materials.filter((m) => m.trim() !== "");
    setSubmitError(null);
    setSubmitting(true);
    try {
      await createProject({
        name: step1Data.name.trim(),
        ebookId: step1Data.ebook?.id ?? null,
        originalWork: step1Data.ebook?.title || step1Data.ebook?.filename || null,
        fixedMaterials: fixedMaterials.length > 0 ? fixedMaterials : undefined,
      });
      await mutateProjects();
      router.push("/project");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setSubmitting(false);
    }
  }, [step1Data, materials, mutateProjects, router]);

  const goNext = () => {
    if (!canNext) return;
    setStep(2);
  };

  const addMaterial = () => setMaterials((m) => [...m, ""]);
  const removeMaterial = (index: number) =>
    setMaterials((m) => m.filter((_, i) => i !== index));
  const setMaterial = (index: number, value: string) =>
    setMaterials((m) => {
      const next = [...m];
      next[index] = value;
      return next;
    });

  return (
    <div className="min-h-full bg-stone-50/50 dark:bg-stone-900/30">
      <div className="border-b border-stone-200 bg-white px-6 py-4 dark:border-stone-700 dark:bg-stone-800/80">
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
            新建项目 {step === 1 ? "— 基本信息" : "— 物料编辑"}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl p-6">
        {step === 1 && (
          <Step1Form
            step1Data={step1Data}
            setStep1Data={setStep1Data}
            ebooks={ebooks}
            uploading={uploading}
            uploadError={uploadError}
            onFile={handleFile}
            canNext={canNext}
            onNext={goNext}
          />
        )}
        {step === 2 && (
          <Step2Form
            step1Data={step1Data}
            materials={materials}
            setMaterials={setMaterials}
            addMaterial={addMaterial}
            removeMaterial={removeMaterial}
            setMaterial={setMaterial}
            onBack={() => setStep(1)}
            onCreate={handleCreate}
            submitting={submitting}
            submitError={submitError}
          />
        )}
      </div>
    </div>
  );
}

function Step1Form({
  step1Data,
  setStep1Data,
  ebooks,
  uploading,
  uploadError,
  onFile,
  canNext,
  onNext,
}: {
  step1Data: Step1Data;
  setStep1Data: React.Dispatch<React.SetStateAction<Step1Data>>;
  ebooks: Ebook[];
  uploading: boolean;
  uploadError: string | null;
  onFile: (file: File) => void;
  canNext: boolean;
  onNext: () => void;
}) {
  const selectedEbook = step1Data.ebook;
  const { data: chapters = [] } = useSWR(
    selectedEbook ? [EBOOKS_KEY, selectedEbook.id, "chapters"] : null,
    () => fetchEbookChapters(selectedEbook!.id)
  );

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-600 dark:bg-stone-800/80">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
            项目名称 <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            value={step1Data.name}
            onChange={(e) =>
              setStep1Data((d) => ({ ...d, name: e.target.value }))
            }
            onBlur={(e) =>
              setStep1Data((d) => ({ ...d, name: e.target.value.trim() }))
            }
            placeholder="输入项目名称"
            className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-600 dark:bg-stone-800/80">
        <h2 className="mb-4 text-sm font-medium text-stone-700 dark:text-stone-300">
          选择电子书 <span className="text-red-500">*</span>
        </h2>

        {ebooks.length === 0 ? (
          <div>
            <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
              暂无电子书，请在本页上传后即可选择
            </p>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/50 p-8 transition-colors hover:border-amber-400 hover:bg-amber-50/30 dark:border-stone-600 dark:bg-stone-800/50 dark:hover:border-amber-500 dark:hover:bg-amber-900/20">
              <input
                type="file"
                accept=".epub,application/epub+zip"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                  e.target.value = "";
                }}
              />
              <span className="text-stone-600 dark:text-stone-400">
                {uploading ? "上传中…" : "点击或拖拽 .epub 文件到此处上传"}
              </span>
            </label>
            {uploadError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {uploadError}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <ul className="space-y-2">
              {ebooks.map((ebook) => (
                <li key={ebook.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setStep1Data((d) => ({ ...d, ebook }))
                    }
                    className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${selectedEbook?.id === ebook.id
                      ? "border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-900/30"
                      : "border-stone-200 bg-white hover:border-stone-300 dark:border-stone-600 dark:bg-stone-800 dark:hover:border-stone-600"
                      }`}
                  >
                    <span className="font-medium text-stone-900 dark:text-stone-100">
                      {ebook.title || ebook.filename}
                    </span>
                    {ebook.author && (
                      <span className="mt-1 block text-xs text-stone-500 dark:text-stone-400">
                        {ebook.author}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              没有需要的书？在本页上传：
            </p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600 transition-colors hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700">
              <input
                type="file"
                accept=".epub,application/epub+zip"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                  e.target.value = "";
                }}
              />
              {uploading ? "上传中…" : "上传 .epub"}
            </label>
            {uploadError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {uploadError}
              </p>
            )}
          </div>
        )}

        {selectedEbook && (
          <div className="mt-6 rounded-lg border border-stone-200 bg-stone-50/50 p-4 dark:border-stone-600 dark:bg-stone-800/50">
            <h3 className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">
              预览
            </h3>
            <p className="font-medium text-stone-900 dark:text-stone-100">
              {selectedEbook.title || selectedEbook.filename}
            </p>
            {selectedEbook.author && (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                作者：{selectedEbook.author}
              </p>
            )}
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              共 {chapters.length} 章
            </p>
            {chapters.length > 0 && (
              <ul className="mt-2 max-h-40 overflow-y-auto text-xs text-stone-600 dark:text-stone-400">
                {chapters.slice(0, 20).map((ch, i) => (
                  <li key={ch.id}>
                    {i + 1}. {ch.title || `第 ${ch.chapterIndex + 1} 章`}
                  </li>
                ))}
                {chapters.length > 20 && (
                  <li className="text-stone-400">… 共 {chapters.length} 章</li>
                )}
              </ul>
            )}
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3">
        <Link
          href="/project"
          className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-700"
        >
          取消
        </Link>
        <button
          type="button"
          disabled={!canNext}
          onClick={onNext}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-amber-600 dark:hover:bg-amber-700"
        >
          下一步：物料编辑
        </button>
      </div>
    </div>
  );
}

function Step2Form({
  step1Data,
  materials,
  setMaterials,
  addMaterial,
  removeMaterial,
  setMaterial,
  onBack,
  onCreate,
  submitting,
  submitError,
}: {
  step1Data: Step1Data;
  materials: string[];
  setMaterials: (v: string[] | ((prev: string[]) => string[])) => void;
  addMaterial: () => void;
  removeMaterial: (index: number) => void;
  setMaterial: (index: number, value: string) => void;
  onBack: () => void;
  onCreate: () => Promise<void>;
  submitting: boolean;
  submitError: string | null;
}) {
  const fixedMaterials = materials.filter((m) => m.trim() !== "");

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-600 dark:bg-stone-800/80">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          <span className="font-medium text-stone-800 dark:text-stone-200">
            项目名称
          </span>
          ：{step1Data.name}
        </p>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          <span className="font-medium text-stone-800 dark:text-stone-200">
            原著
          </span>
          ：{step1Data.ebook?.title || step1Data.ebook?.filename || "—"}
        </p>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-600 dark:bg-stone-800/80">
        <h2 className="mb-4 text-sm font-medium text-stone-700 dark:text-stone-300">
          固定物料
        </h2>
        <p className="mb-4 text-sm text-stone-500 dark:text-stone-400">
          添加本项目使用的固定物料名称，可多条
        </p>
        <ul className="space-y-3">
          {materials.map((value, index) => (
            <li key={index} className="flex gap-2">
              <input
                type="text"
                value={value}
                onChange={(e) => setMaterial(index, e.target.value)}
                placeholder="物料名称"
                className="flex-1 rounded-lg border border-stone-200 bg-white px-4 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
              />
              <button
                type="button"
                onClick={() => removeMaterial(index)}
                className="shrink-0 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-700"
              >
                删除
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addMaterial}
          className="mt-3 rounded-lg border border-dashed border-stone-300 px-4 py-2 text-sm text-stone-600 hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-700 dark:border-stone-600 dark:text-stone-400 dark:hover:border-amber-500 dark:hover:bg-amber-900/20"
        >
          + 添加一条物料
        </button>
      </section>

      <div className="flex justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-700"
        >
          上一步
        </button>
        <div className="flex flex-col items-end gap-2">
          {submitError && (
            <p className="w-full text-sm text-red-600 dark:text-red-400">
              {submitError}
            </p>
          )}
          <div className="flex gap-3">
            <Link
              href="/project"
              className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-700"
            >
              取消
            </Link>
            <button
              type="button"
              onClick={onCreate}
              disabled={submitting}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-60 dark:bg-amber-600 dark:hover:bg-amber-700"
            >
              {submitting ? "创建中…" : "完成创建"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
