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

      <div className="flex flex-wrap items-end gap-3 rounded-[20px] border border-slate-200/90 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <label className="grid flex-1 min-w-[200px] gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">검색</span>
          <input
            value={filters.query}
            onChange={(event) => onFiltersChange((current) => ({ ...current, query: event.target.value }))}
            placeholder="제목 또는 설명 검색"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="grid w-[130px] gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">담당자</span>
          <select
            value={filters.assignee}
            onChange={(event) => onFiltersChange((current) => ({ ...current, assignee: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">전체</option>
            {normalizedAssigneeOptions.map((assignee) => (
              <option key={assignee} value={assignee}>
                {assignee}
              </option>
            ))}
          </select>
        </label>
        <label className="grid w-[110px] gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">완료 여부</span>
          <select
            value={filters.completed}
            onChange={(event) =>
              onFiltersChange((current) => ({
                ...current,
                completed: event.target.value as TaskFilters["completed"],
              }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="all">전체</option>
            <option value="open">미완료</option>
            <option value="done">완료</option>
          </select>
        </label>
        <label className="grid w-[110px] gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">상태</span>
          <select
            value={filters.status}
            onChange={(event) =>
              onFiltersChange((current) => ({
                ...current,
                status: event.target.value as TaskFilters["status"],
              }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
        <label className="grid w-[110px] gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">우선순위</span>
          <select
            value={filters.priority}
            onChange={(event) =>
              onFiltersChange((current) => ({
                ...current,
                priority: event.target.value as TaskFilters["priority"],
              }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="all">전체</option>
            <option value="low">낮음</option>
            <option value="medium">보통</option>
            <option value="high">높음</option>
            <option value="urgent">긴급</option>
          </select>
        </label>
        <label className="grid w-[120px] gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">정렬</span>
          <select
            value={filters.sortBy}
            onChange={(event) =>
              onFiltersChange((current) => ({
                ...current,
                sortBy: event.target.value as TaskFilters["sortBy"],
              }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="dueDate">마감일순</option>
            <option value="priority">우선순위순</option>
            <option value="updatedAt">최근 수정순</option>
            <option value="title">제목순</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="relative flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:bg-rose-950/20 dark:text-rose-300">
            <span className="block h-1.5 w-1.5 rounded-full bg-rose-500" />
            지연됨
          </span>
          <span className="relative flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
            <span className="block h-1.5 w-1.5 rounded-full bg-amber-500" />
            마감 임박
          </span>
          {isDatabaseMode ? (
            <span className="rounded-full px-2 py-1 text-[11px] text-slate-500 dark:text-slate-400">
              DB 모드에서는 복제가 제한됩니다.
            </span>
          ) : null}
        </div>
        <label className="flex items-center gap-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hideCompleted}
            onChange={(event) =>
              onFiltersChange((current) => ({
                ...current,
                hideCompleted: event.target.checked,
              }))
            }
            className="h-3.5 w-3.5 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
          />
          완료 숨기기
        </label>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            {tasks.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                {emptyMessage}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                <div className="hidden grid-cols-[auto_minmax(0,2.5fr)_minmax(100px,0.8fr)_minmax(90px,0.6fr)_minmax(90px,0.6fr)_minmax(160px,1fr)_minmax(80px,0.7fr)_auto] items-center gap-3 bg-slate-50/80 px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:bg-slate-900/50 dark:text-slate-400 xl:grid">
                  <span className="w-5" />
                  <span>Task 제목</span>
                  <span>상태</span>
                  <span>우선순위</span>
                  <span>담당자</span>
                  <span>일정 / 마감</span>
                  <span>메모</span>
                  <span className="text-right w-[90px]">관리</span>
                </div>
                {tasks.map((task) => (
                  <article
                    key={task.id}
                    onClick={() => onOpenTask(task.id)}
                    className={cn(
                      "cursor-pointer px-4 py-2.5 transition-colors group",
                      isOverdue(task)
                        ? "bg-rose-50/30 hover:bg-rose-50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20"
                        : isDueSoon(task)
                          ? "bg-amber-50/30 hover:bg-amber-50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20"
                          : "bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900",
                    )}
                  >
                    <div className="flex flex-col gap-2 xl:grid xl:grid-cols-[auto_minmax(0,2.5fr)_minmax(100px,0.8fr)_minmax(90px,0.6fr)_minmax(90px,0.6fr)_minmax(160px,1fr)_minmax(80px,0.7fr)_auto] xl:items-center xl:gap-3">
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
                        className="mt-0.5 h-[18px] w-[18px] rounded border-slate-300 text-brand-500 xl:mt-0 focus:ring-brand-500"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <InlineEditableText
                            value={task.title}
                            onSave={(value) => onPatchTask(task.id, { title: value })}
                            className={cn(
                              "truncate text-[14px] font-semibold text-slate-900 dark:text-white",
                              task.isCompleted && "line-through opacity-60",
                            )}
                            inputClassName="w-full text-[14px] font-semibold"
                          />
                        </div>
                        {renderTaskContext ? (
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {renderTaskContext(task)}
                          </div>
                        ) : null}
                        <p className="mt-0.5 truncate text-[11px] text-slate-400 xl:hidden px-0.5">{task.description || "설명 없음"}</p>
                      </div>

                      <div className="hidden xl:block min-w-0">
                        <StatusBadge status={task.status} />
                      </div>
                      
                      <div className="hidden xl:block min-w-0">
                        <PriorityBadge priority={task.priority} />
                      </div>

                      <div className="hidden xl:block min-w-0">
                        <InlineEditableText
                          value={task.assignee}
                          placeholder="미지정"
                          onSave={(value) => onPatchTask(task.id, { assignee: value })}
                          className="truncate text-[13px] text-slate-700 dark:text-slate-200"
                          inputClassName="w-full text-[13px]"
                          disabled={isDatabaseMode}
                        />
                      </div>

                      <div className="hidden xl:flex xl:flex-col min-w-0">
                        <span className="truncate text-[12px] text-slate-700 dark:text-slate-200">
                          {formatDate(task.startDate)} ~ {formatDate(task.dueDate)}
                        </span>
                        <span className="truncate text-[11px] font-medium mt-0.5 text-brand-600 dark:text-brand-400">
                          {formatRelativeDateLabel(task.dueDate)}
                        </span>
                      </div>

                      <div className="hidden xl:block min-w-0">
                        <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">{task.memo || "-"}</p>
                      </div>

                      <div className="flex flex-wrap gap-1 xl:justify-end xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditTask(task.id);
                          }}
                          className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200/50 dark:text-slate-300 dark:hover:bg-slate-700/50 transition-colors"
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
                          className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200/50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700/50 transition-colors"
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
                          className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-950/50 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                      
                      {/* Mobile view metadata (visible only below xl) */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 xl:hidden">
                         <StatusBadge status={task.status} />
                         <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300">
                           {task.assignee || "미지정"}
                         </span>
                         <span className="text-[12px] text-slate-500">
                           {formatDate(task.startDate)} ~ {formatDate(task.dueDate)}
                         </span>
                         <PriorityBadge priority={task.priority} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
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
