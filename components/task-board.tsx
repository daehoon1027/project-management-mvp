"use client";

import { statusOptions } from "@/lib/constants";
import { cn, formatDate, isDueSoon, isOverdue } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";

type TaskBoardProps = {
  tasks: Task[];
  onStatusDrop: (taskId: string, status: TaskStatus) => void;
  onOpenTask: (taskId: string) => void;
};

export function TaskBoard({ tasks, onStatusDrop, onOpenTask }: TaskBoardProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {statusOptions.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.value);

        return (
          <div
            key={column.value}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const taskId = event.dataTransfer.getData("text/task-id");
              if (taskId) {
                onStatusDrop(taskId, column.value);
              }
            }}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{column.label}</span>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                {columnTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {columnTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)}
                  onClick={() => onOpenTask(task.id)}
                  className={cn(
                    "w-full rounded-2xl border px-3 py-3 text-left transition hover:border-brand-300",
                    isOverdue(task)
                      ? "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/20"
                      : isDueSoon(task)
                        ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-semibold text-slate-900 dark:text-white">{task.title}</h4>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{task.description || "설명 없음"}</p>
                    <div className="flex items-center justify-between">
                      <StatusBadge status={task.status} />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                </button>
              ))}
              {columnTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
                  여기에 Task를 드롭하세요
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
