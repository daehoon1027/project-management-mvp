"use client";

import { useMemo, type SetStateAction } from "react";
import { Card } from "@/components/ui/card";
import { TaskWorkspacePanel } from "@/components/task-workspace-panel";
import { cn, filterTasks, isDueSoon, isOverdue, sortTasks } from "@/lib/utils";
import { getAssigneeSummary } from "@/utils/task-utils";
import type { Project, Task, TaskFilters, TaskPatch } from "@/types";

type AssigneeWorkspaceProps = {
  projects: Project[];
  tasks: Task[];
  filters: TaskFilters;
  isDatabaseMode?: boolean;
  onFiltersChange: (nextFilters: SetStateAction<TaskFilters>) => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenTask: (taskId: string) => void;
  onPatchTask: (taskId: string, patch: TaskPatch) => void;
  onDuplicateTask: (taskId: string) => void;
};

function normalizeAssignee(value: string) {
  return value.trim() || "미지정";
}

export function AssigneeWorkspace({
  projects,
  tasks,
  filters,
  isDatabaseMode = false,
  onFiltersChange,
  onEditTask,
  onDeleteTask,
  onOpenTask,
  onPatchTask,
  onDuplicateTask,
}: AssigneeWorkspaceProps) {
  const projectMap = useMemo(() => new Map(projects.map((project) => [project.id, project.name])), [projects]);
  const assigneeOptions = useMemo(
    () =>
      tasks
        .map((task) => normalizeAssignee(task.assignee))
        .filter((value, index, values) => values.indexOf(value) === index)
        .sort((left, right) => left.localeCompare(right, "ko-KR")),
    [tasks],
  );

  const sourceTasks = useMemo(
    () => (filters.assignee ? tasks.filter((task) => normalizeAssignee(task.assignee) === filters.assignee) : tasks),
    [filters.assignee, tasks],
  );

  const filteredTasks = useMemo(() => sortTasks(filterTasks(sourceTasks, filters), filters.sortBy), [filters, sourceTasks]);
  const openCount = sourceTasks.filter((task) => !task.isCompleted).length;
  const overdueCount = sourceTasks.filter((task) => isOverdue(task)).length;
  const dueSoonCount = sourceTasks.filter((task) => isDueSoon(task)).length;
  const topAssignees = getAssigneeSummary(tasks).slice(0, 5);
  const selectedLabel = filters.assignee || "전체 담당자";

  return (
    <section className="space-y-6">
      <Card className="space-y-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              ASSIGNEE VIEW
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{selectedLabel}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                {filters.assignee
                  ? "선택한 담당자에게 배정된 업무를 프로젝트를 넘나들며 한 번에 조회합니다."
                  : "담당자를 선택하거나 전체 상태를 보면서 업무 분배 현황을 확인할 수 있습니다."}
              </p>
            </div>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">조회 담당자</span>
            <select
              value={filters.assignee}
              onChange={(event) => onFiltersChange((current) => ({ ...current, assignee: event.target.value }))}
              className="min-w-[220px] rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">전체 담당자</option>
              {assigneeOptions.map((assignee) => (
                <option key={assignee} value={assignee}>
                  {assignee}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[26px] border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 p-5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
            <p className="text-sm text-slate-500 dark:text-slate-400">조회 대상 Task</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{sourceTasks.length}</p>
          </div>
          <div className="rounded-[26px] border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm text-slate-500 dark:text-slate-400">미완료 Task</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{openCount}</p>
          </div>
          <div className="rounded-[26px] border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm text-slate-500 dark:text-slate-400">지연 / 임박</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {overdueCount} / {dueSoonCount}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onFiltersChange((current) => ({ ...current, assignee: "" }))}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              filters.assignee === ""
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
            )}
          >
            전체
          </button>
          {topAssignees.map((summary) => (
            <button
              key={summary.assignee}
              type="button"
              onClick={() => onFiltersChange((current) => ({ ...current, assignee: summary.assignee }))}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                filters.assignee === summary.assignee
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
              )}
            >
              {summary.assignee} · {summary.total}
            </button>
          ))}
        </div>
      </Card>

      <TaskWorkspacePanel
        title="담당자 Task Workspace"
        description="프로젝트를 가로질러 담당자별로 Task를 추적하고 바로 수정할 수 있습니다."
        tasks={filteredTasks}
        filters={filters}
        isDatabaseMode={isDatabaseMode}
        assigneeOptions={assigneeOptions}
        emptyMessage="선택한 담당자와 조건에 맞는 Task가 없습니다. 다른 담당자를 선택하거나 필터를 조정해 보세요."
        renderTaskContext={(task) => (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {projectMap.get(task.projectId) ?? "미분류 프로젝트"}
          </span>
        )}
        onFiltersChange={onFiltersChange}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onOpenTask={onOpenTask}
        onPatchTask={onPatchTask}
        onDuplicateTask={onDuplicateTask}
      />
    </section>
  );
}
