"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { flattenProjects, getDescendantProjectIds, isProjectHiddenByCollapsedAncestor } from "@/lib/project-tree";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/store/use-project-store";
import type { Project, Task } from "@/types";

type ProjectTreeProps = {
  projects: Project[];
  tasks: Task[];
  selectedProjectId: string | null;
  isDatabaseMode?: boolean;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
};

export function ProjectTree({
  projects,
  tasks,
  selectedProjectId,
  isDatabaseMode = false,
  onDeleteProject: _onDeleteProject,
  onDuplicateProject: _onDuplicateProject,
}: ProjectTreeProps) {
  const expandedProjectIds = useProjectStore((state) => state.expandedProjectIds);
  const selectProject = useProjectStore((state) => state.selectProject);
  const toggleProjectExpanded = useProjectStore((state) => state.toggleProjectExpanded);

  const tree = flattenProjects(projects);
  const taskSummaryByProjectId = useMemo(
    () =>
      new Map(
        projects.map((project) => {
          const relatedProjectIds = new Set([project.id, ...getDescendantProjectIds(projects, project.id)]);
          const relatedTasks = tasks.filter((task) => relatedProjectIds.has(task.projectId));

          return [
            project.id,
            {
              total: relatedTasks.length,
              open: relatedTasks.filter((task) => !task.isCompleted).length,
            },
          ];
        }),
      ),
    [projects, tasks],
  );
  const directTaskPreviewByProjectId = useMemo(
    () =>
      new Map(
        projects.map((project) => [
          project.id,
          tasks
            .filter((task) => task.projectId === project.id)
            .slice(0, 3)
            .map((task) => ({
              id: task.id,
              title: task.title,
              isCompleted: task.isCompleted,
            })),
        ]),
      ),
    [projects, tasks],
  );

  const hasChildren = (projectId: string) => projects.some((project) => project.parentId === projectId);

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-200/90 bg-gradient-to-r from-slate-50 to-white px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">프로젝트 맵</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">계층과 직속 Task를 한 줄씩 바로 읽을 수 있게 정리했습니다.</p>
        </div>
      </div>

      <div className="scroll-panel max-h-[calc(100vh-220px)] space-y-3 overflow-y-auto px-4 py-4">
        {tree.map((project) => {
          const childExists = hasChildren(project.id);
          const expanded = expandedProjectIds.includes(project.id);
          const taskSummary = taskSummaryByProjectId.get(project.id) ?? { total: 0, open: 0 };
          const directTaskPreview = directTaskPreviewByProjectId.get(project.id) ?? [];
          const childCount = projects.filter((candidate) => candidate.parentId === project.id).length;

          if (isProjectHiddenByCollapsedAncestor(projects, project, expandedProjectIds)) {
            return null;
          }

          return (
            <article
              key={project.id}
              className={cn(
                "relative rounded-[22px] border p-3.5 transition",
                selectedProjectId === project.id
                  ? "border-brand-400 bg-gradient-to-r from-brand-50 via-white to-sky-50 shadow-[0_16px_36px_rgba(47,124,255,0.14)] dark:border-brand-700 dark:from-brand-950/20 dark:via-slate-950 dark:to-slate-950"
                  : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950",
              )}
              style={{ marginLeft: `${(project.depth - 1) * 14}px` }}
            >
              {project.depth > 1 ? (
                <span className="absolute -left-3 top-0 h-full w-px bg-gradient-to-b from-slate-200 to-transparent dark:from-slate-800" />
              ) : null}

              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => (childExists ? toggleProjectExpanded(project.id) : selectProject(project.id))}
                  className={cn(
                    "mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl border text-xs font-bold transition",
                    childExists
                      ? "border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      : "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500",
                  )}
                  aria-label={childExists ? "프로젝트 펼치기 또는 접기" : "프로젝트 선택"}
                >
                  {childExists ? (expanded ? "-" : "+") : "•"}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <button type="button" onClick={() => selectProject(project.id)} className="min-w-0 flex-1 text-left">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Level {project.depth}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            하위 {childCount}
                          </span>
                          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                            전체 Task {taskSummary.total}
                          </span>
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                            미완료 {taskSummary.open}
                          </span>
                        </div>
                        <h3 className="mt-2 truncate text-[16px] font-semibold text-slate-900 dark:text-white">{project.name}</h3>
                        <p className="mt-1 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">
                          {project.description || "프로젝트 설명 없음"}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {directTaskPreview.length > 0 ? (
                            directTaskPreview.map((task) => (
                              <span
                                key={task.id}
                                className={cn(
                                  "rounded-full border px-3 py-1 text-xs font-semibold",
                                  task.isCompleted
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300"
                                    : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
                                )}
                              >
                                {task.title}
                              </span>
                            ))
                          ) : (
                            <span className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs font-medium text-slate-400 dark:border-slate-700 dark:text-slate-500">
                              직속 Task 없음
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <div className="min-w-[180px] rounded-[18px] border border-slate-200/80 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span>진행률</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="mt-2">
                        <ProgressBar value={project.progress} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Card>
  );
}
