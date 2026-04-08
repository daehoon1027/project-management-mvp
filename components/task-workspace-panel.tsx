"use client";

import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { TaskBoard } from "@/components/task-board";
import { TaskTimeline } from "@/components/task-timeline";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { InlineEditableText } from "@/components/ui/inline-editable-text";
import { detailViewOptions } from "@/lib/constants";
import { cn, formatDate, formatRelativeDateLabel, isDueSoon, isOverdue } from "@/lib/utils";
import type { DetailViewMode, Task, TaskFilters, TaskPatch } from "@/types";

type TaskWorkspacePanelProps = {
  title: string;
  description: string;
  tasks: Task[];
  filters: TaskFilters;
  isDatabaseMode?: boolean;
  emptyMessage: string;
  assigneeOptions?: string[];
  renderTaskContext?: (task: Task) => ReactNode;
  onFiltersChange: Dispatch<SetStateAction<TaskFilters>>;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenTask: (taskId: string) => void;
  onPatchTask: (taskId: string, patch: TaskPatch) => void;
  onDuplicateTask: (taskId: string) => void;
};

function normalizeAssignee(value: string) {
  return value.trim() || "미지정";
}

const supportedViewOptions = detailViewOptions.filter(
  (option): option is { value: Exclude<DetailViewMode, "calendar">; label: string } => option.value !== "calendar",
);

export function TaskWorkspacePanel({
  title,
  description,
  tasks,
  filters,
  isDatabaseMode = false,
  emptyMessage,
  assigneeOptions,
  renderTaskContext,
  onFiltersChange,
  onEditTask,
  onDeleteTask,
  onOpenTask,
  onPatchTask,
  onDuplicateTask,
}: TaskWorkspacePanelProps) {
  const [viewMode, setViewMode] = useState<Exclude<DetailViewMode, "calendar">>("list");

  const normalizedAssigneeOptions = useMemo(
    () =>
      (assigneeOptions ?? tasks.map((task) => normalizeAssignee(task.assignee)))
        .map(normalizeAssignee)
        .filter((value, index, values) => values.indexOf(value) === index)
        .sort((left, right) => left.localeCompare(right, "ko-KR")),
    [assigneeOptions, tasks],
  );

  return (
    <Card className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {tasks.length}건
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          {supportedViewOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setViewMode(option.value)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                viewMode === option.value
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 rounded-[28px] border border-slate-200/90 bg-gradient-to-b from-slate-50 to-white p-4 md:grid-cols-2 xl:grid-cols-7 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
        <label className="grid gap-2 xl:col-span-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">검색</span>
          <input
            value={filters.query}
            onChange={(event) => onFiltersChange((current) => ({ ...current, query: event.target.value }))}
            placeholder="제목 또는 설명 검색"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">담당자</span>
          <select
            value={filters.assignee}
            onChange={(event) => onFiltersChange((current) => ({ ...current, assignee: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">전체 담당자</option>
            {normalizedAssigneeOptions.map((assignee) => (
              <option key={assignee} value={assignee}>
                {assignee}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">완료 여부</span>
          <select
            value={filters.completed}
            onChange={(event) =>
              onFiltersChange((current) => ({
                ...current,
                completed: event.target.value as TaskFilters["completed"],
              }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="all">전체</option>
            <option value="open">미완료</option>
            <option value="done">완료</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">상태</span>
          <select
            value={filters.status}
            onChange={(event) =>
              onFiltersChange((current) => ({
                ...current,
                status: event.target.value as TaskFilters["status"],
              }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="all">전체</option>
            <option value="planned">예정</option>
            <option value="in_progress">진행 중</option>
            <option value="in_review">검토 중</option>
            <option value="approval_pending">승인 대기</option>
            <option value="done">완료</option>
            <option value="on_hold">보류</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">우선순위</span>
          <select
            value={filters.priority}
            onChange={(event) =>
              onFiltersChange((current) => ({
                ...current,
                priority: event.target.value as TaskFilters["priority"],
              }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="all">전체</option>
            <option value="low">낮음</option>
            <option value="medium">보통</option>
            <option value="high">높음</option>
            <option value="urgent">긴급</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">정렬</span>
          <select
            value={filters.sortBy}
            onChange={(event) =>
              onFiltersChange((current) => ({
                ...current,
                sortBy: event.target.value as TaskFilters["sortBy"],
              }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="dueDate">마감일순</option>
            <option value="priority">우선순위순</option>
            <option value="updatedAt">최근 수정순</option>
            <option value="title">제목순</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 dark:bg-rose-950/20 dark:text-rose-300">
            붉은 강조: 지연
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
            노란 강조: 마감 임박
          </span>
          {isDatabaseMode ? (
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-950/20 dark:text-sky-300">
              DB 모드에서는 복제와 담당자 직접 입력이 일부 제한됩니다.
            </span>
          ) : null}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={filters.hideCompleted}
            onChange={(event) =>
              onFiltersChange((current) => ({
                ...current,
                hideCompleted: event.target.checked,
              }))
            }
            className="h-4 w-4 rounded border-slate-300 text-brand-500"
          />
          완료 Task 숨기기
        </label>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              {emptyMessage}
            </div>
          ) : (
            tasks.map((task) => (
              <article
                key={task.id}
                onClick={() => onOpenTask(task.id)}
                className={cn(
                  "cursor-pointer rounded-[24px] border px-4 py-4 transition",
                  isOverdue(task)
                    ? "border-rose-200 bg-gradient-to-r from-rose-50 to-white dark:border-rose-900 dark:from-rose-950/20 dark:to-slate-950"
                    : isDueSoon(task)
                      ? "border-amber-200 bg-gradient-to-r from-amber-50 to-white dark:border-amber-900 dark:from-amber-950/20 dark:to-slate-950"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950",
                )}
              >
                <div className="flex min-w-0 gap-3">
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onClick={(event) => event.stopPropagation()}
                    onChange={() =>
                      onPatchTask(task.id, {
                        isCompleted: !task.isCompleted,
                        status: !task.isCompleted ? "done" : task.status === "done" ? "planned" : task.status,
                      })
                    }
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-brand-500"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <InlineEditableText
                            value={task.title}
                            onSave={(value) => onPatchTask(task.id, { title: value })}
                            className={cn(
                              "text-base font-semibold text-slate-900 dark:text-white",
                              task.isCompleted && "line-through opacity-60",
                            )}
                            inputClassName="w-full text-base font-semibold"
                          />
                          <StatusBadge status={task.status} />
                          <PriorityBadge priority={task.priority} />
                        </div>

                        {renderTaskContext ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                            {renderTaskContext(task)}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditTask(task.id);
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDuplicateTask(task.id);
                          }}
                          disabled={isDatabaseMode}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          복제
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (window.confirm("이 Task를 삭제할까요?")) {
                              onDeleteTask(task.id);
                            }
                          }}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/20 dark:hover:bg-rose-950/30"
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">{task.description || "설명 없음"}</p>

                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-[18px] border border-slate-200/80 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">담당자</p>
                        <InlineEditableText
                          value={task.assignee}
                          placeholder="담당자 미지정"
                          onSave={(value) => onPatchTask(task.id, { assignee: value })}
                          className="mt-1 text-sm text-slate-700 dark:text-slate-200"
                          inputClassName="mt-1 w-full text-sm"
                          disabled={isDatabaseMode}
                        />
                      </div>
                      <div className="rounded-[18px] border border-slate-200/80 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">일정</p>
                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                          {formatDate(task.startDate)} ~ {formatDate(task.dueDate)}
                        </p>
                      </div>
                      <div className="rounded-[18px] border border-slate-200/80 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">마감 기준</p>
                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{formatRelativeDateLabel(task.dueDate)}</p>
                      </div>
                      <div className="rounded-[18px] border border-slate-200/80 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">메모</p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-700 dark:text-slate-200">{task.memo || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      ) : null}

      {viewMode === "board" ? (
        <TaskBoard
          tasks={tasks}
          onOpenTask={onOpenTask}
          onStatusDrop={(taskId, status) =>
            onPatchTask(taskId, {
              status,
              isCompleted: status === "done",
            })
          }
        />
      ) : null}

      {viewMode === "timeline" ? <TaskTimeline tasks={tasks} onOpenTask={onOpenTask} /> : null}
    </Card>
  );
}
