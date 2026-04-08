"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/types";

type ProjectFormProps = {
  mode: "create" | "edit";
  parentProject: Project | null;
  initialProject: Project | null;
  onSubmit: (values: { name: string; description: string }) => void;
  onCancel: () => void;
};

export function ProjectForm({
  mode,
  parentProject,
  initialProject,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const [name, setName] = useState(initialProject?.name ?? "");
  const [description, setDescription] = useState(initialProject?.description ?? "");

  useEffect(() => {
    setName(initialProject?.name ?? "");
    setDescription(initialProject?.description ?? "");
  }, [initialProject, mode, parentProject]);

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();

        if (!name.trim()) {
          window.alert("프로젝트명을 입력해 주세요.");
          return;
        }

        onSubmit({ name, description });
      }}
    >
      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">프로젝트명</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            placeholder="프로젝트명을 입력하세요"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">상위 프로젝트</span>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {parentProject ? `${parentProject.name} / 깊이 ${parentProject.depth + 1}` : "상위 프로젝트 없음"}
          </div>
          <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {parentProject ? `${parentProject.name} / 깊이 ${parentProject.depth + 1}` : "루트 프로젝트"}
          </div>
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">설명</span>
        <textarea
          rows={5}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          placeholder="프로젝트 목표와 범위를 적어주세요"
        />
      </label>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          취소
        </button>
        <button
          type="submit"
          className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
        >
          {mode === "create" ? "프로젝트 저장" : "프로젝트 업데이트"}
        </button>
      </div>
    </form>
  );
}
