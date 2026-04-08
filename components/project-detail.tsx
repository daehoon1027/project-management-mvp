"use client";

import { useMemo, type Dispatch, type SetStateAction } from "react";
import { TaskWorkspacePanel } from "@/components/task-workspace-panel";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
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
  const childProjects = selectedProject ? projects.filter((project) => project.parentId === selectedProject.id) : [];
  const descendantProjects = selectedProject
    ? projects.filter((project) => relatedProjectIds.includes(project.id) && project.id !== selectedProject.id)
    : [];
  const scopedProjects = selectedProject ? projects.filter((project) => relatedProjectIds.includes(project.id)) : [];
  const directProjectTasks = selectedProject ? tasks.filter((task) => task.projectId === selectedProject.id).length : 0;
  const openTaskCount = baseProjectTasks.filter((task) => !task.isCompleted).length;
  const assigneeOptions = useMemo(
    () =>
      baseProjectTasks
        .map((task) => task.assignee.trim() || "미지정")
        .filter((value, index, values) => values.indexOf(value) === index)
        .sort((left, right) => left.localeCompare(right, "ko-KR")),
    [baseProjectTasks],
  );

  if (!selectedProject) {
    return <Card className="p-12 text-center text-slate-500 dark:text-slate-400">프로젝트를 선택해 주세요.</Card>;
  }

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200/90 px-6 py-4 dark:border-slate-800">
          <div className="rounded-[24px] border border-slate-200/80 bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <p>선택한 프로젝트를 기준으로 하위 프로젝트 {descendantProjects.length}개와 연결된 Task를 함께 보여줍니다.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {scopedProjects.map((project) => (
                <span
                  key={project.id}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {project.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[26px] border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 p-5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">프로젝트 진행률</p>
                <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{selectedProject.progress}%</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                Auto Rollup
              </span>
            </div>
            <ProgressBar value={selectedProject.progress} label="전체 진행" />
          </div>

          <div className="rounded-[26px] border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm text-slate-500 dark:text-slate-400">직속 하위 프로젝트</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{childProjects.length}</p>
          </div>

          <div className="rounded-[26px] border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm text-slate-500 dark:text-slate-400">직속 Task</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{directProjectTasks}</p>
          </div>

          <div className="rounded-[26px] border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm text-slate-500 dark:text-slate-400">연결된 미완료 Task</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{openTaskCount}</p>
          </div>
        </div>
      </Card>

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
    </section>
  );
}
