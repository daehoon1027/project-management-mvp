"use client";

import { useMemo, type Dispatch, type SetStateAction } from "react";
import { TaskWorkspacePanel } from "@/components/task-workspace-panel";
import { getDescendantProjectIds, getProjectPath } from "@/lib/project-tree";
import { filterTasks, sortTasks } from "@/lib/utils";
import type { Project, Task, TaskFilters, TaskPatch } from "@/types";

type ProjectDetailProps = {
  selectedProject: Project | null;
  projects: Project[];
  tasks: Task[];
  filters: TaskFilters;
  isDatabaseMode?: boolean;
  onFiltersChange: Dispatch<SetStateAction<TaskFilters>>;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenTask: (taskId: string) => void;
  onPatchTask: (taskId: string, patch: TaskPatch) => void;
  onDuplicateTask: (taskId: string) => void;
};

export function ProjectDetail({
  selectedProject,
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
}: ProjectDetailProps) {
  const relatedProjectIds = useMemo(() => {
    if (!selectedProject) {
      return [];
    }

    return [selectedProject.id, ...getDescendantProjectIds(projects, selectedProject.id)];
  }, [projects, selectedProject]);

  const projectPathById = useMemo(
    () =>
      new Map(
        projects.map((project) => [
          project.id,
          getProjectPath(projects, project.id)
            .map((node) => node.name)
            .join(" / "),
        ]),
      ),
    [projects],
  );

  const baseProjectTasks = useMemo(() => {
    if (!selectedProject) {
      return [];
    }

    const includedProjectIds = new Set(relatedProjectIds);
    return tasks.filter((task) => includedProjectIds.has(task.projectId));
  }, [relatedProjectIds, selectedProject, tasks]);

  const projectTasks = useMemo(() => sortTasks(filterTasks(baseProjectTasks, filters), filters.sortBy), [baseProjectTasks, filters]);
  const assigneeOptions = useMemo(
    () =>
      baseProjectTasks
        .map((task) => task.assignee.trim() || "미지정")
        .filter((value, index, values) => values.indexOf(value) === index)
        .sort((left, right) => left.localeCompare(right, "ko-KR")),
    [baseProjectTasks],
  );

  if (!selectedProject) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
        프로젝트를 선택하면 연결된 Task가 여기에 표시됩니다.
      </div>
    );
  }

  return (
    <TaskWorkspacePanel
      title={`${selectedProject.name} 연결 Task`}
      description="선택한 프로젝트와 하위 프로젝트에 연결된 Task를 한 화면에서 추적합니다."
      tasks={projectTasks}
      filters={filters}
      isDatabaseMode={isDatabaseMode}
      assigneeOptions={assigneeOptions}
      emptyMessage="선택한 프로젝트 범위에서 조건에 맞는 Task가 없습니다. 필터를 조정해 보세요."
      renderTaskContext={(task) => (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {projectPathById.get(task.projectId) ?? "연결 프로젝트 없음"}
        </span>
      )}
      onFiltersChange={onFiltersChange}
      onEditTask={onEditTask}
      onDeleteTask={onDeleteTask}
      onOpenTask={onOpenTask}
      onPatchTask={onPatchTask}
      onDuplicateTask={onDuplicateTask}
    />
  );
}
