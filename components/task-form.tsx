"use client";

import { useEffect, useState } from "react";
import { priorityOptions, statusOptions } from "@/lib/constants";
import type { Project, Task, TaskInput, TaskStatus } from "@/types";

type TaskFormProps = {
  mode: "create" | "edit";
  project: Project | null;
  initialTask: Task | null;
  isDatabaseMode?: boolean;
  onSubmit: (values: TaskInput) => void;
  onCancel: () => void;
};

const defaultValues: TaskInput = {
  parentTaskId: null,
  title: "",
  description: "",
  assignee: "",
  assigneeId: null,
  priority: "medium",
  status: "planned",
  isCompleted: false,
  startDate: "",
  dueDate: "",
  memo: "",
  checklist: [],
  approval: {
    status: "not_required",
    approverId: null,
    approvedAt: null,
  },
  createdById: null,
  updatedById: null,
};

export function TaskForm({ mode, project, initialTask, isDatabaseMode = false, onSubmit, onCancel }: TaskFormProps) {
  const [values, setValues] = useState<TaskInput>(initialTask ?? defaultValues);

  useEffect(() => {
    setValues(initialTask ?? defaultValues);
  }, [initialTask, mode, project]);

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();

        if (!values.title.trim()) {
          window.alert("Task 제목을 입력해 주세요.");
          return;
        }

        onSubmit(values);
      }}
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">제목</span>
          <input
            required
            value={values.title}
            onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            placeholder="Task 제목"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">담당자</span>
          <input
            value={values.assignee}
            onChange={(event) => setValues((current) => ({ ...current, assignee: event.target.value }))}
            disabled={isDatabaseMode}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            placeholder={
              isDatabaseMode ? "DB 모드에서는 다음 단계에 사용자 선택으로 연결합니다." : "담당자 이름"
            }
          />
        </label>
      </div>

      {isDatabaseMode ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          현재 DB 모드에서는 담당자를 자유 입력하는 대신, 다음 단계에서 사용자 선택 방식으로 연결할 예정입니다.
        </p>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">설명</span>
        <textarea
          rows={4}
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          placeholder="Task 설명"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">시작일</span>
          <input
            type="date"
            value={values.startDate}
            onChange={(event) => setValues((current) => ({ ...current, startDate: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">마감일</span>
          <input
            type="date"
            value={values.dueDate}
            onChange={(event) => setValues((current) => ({ ...current, dueDate: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">우선순위</span>
          <select
            value={values.priority}
            onChange={(event) => setValues((current) => ({ ...current, priority: event.target.value as TaskInput["priority"] }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">상태</span>
          <select
            value={values.status}
            onChange={(event) =>
              setValues((current) => {
                const nextStatus = event.target.value as TaskStatus;
                return {
                  ...current,
                  status: nextStatus,
                  isCompleted: nextStatus === "done" ? true : current.isCompleted && nextStatus === current.status,
                };
              })
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">메모</span>
        <textarea
          rows={4}
          value={values.memo}
          onChange={(event) => setValues((current) => ({ ...current, memo: event.target.value }))}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          placeholder="추가 메모"
        />
      </label>

      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
        <input
          type="checkbox"
          checked={values.isCompleted}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              isCompleted: event.target.checked,
              status: event.target.checked ? "done" : current.status === "done" ? "planned" : current.status,
            }))
          }
          className="h-4 w-4 rounded border-slate-300 text-brand-500"
        />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">완료 여부</span>
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
          {mode === "create" ? "Task 생성" : "Task 업데이트"}
        </button>
      </div>
    </form>
  );
}
