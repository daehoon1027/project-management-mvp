"use client";

import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { flattenProjects, isProjectHiddenByCollapsedAncestor } from "@/lib/project-tree";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/store/use-project-store";
import type { Project } from "@/types";

type ProjectTreeProps = {
  projects: Project[];
  selectedProjectId: string | null;
  isDatabaseMode?: boolean;
  onCreateRoot: () => void;
  onCreateChild: (projectId: string) => void;
  onEditProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
};

export function ProjectTree({
  projects,
  selectedProjectId,
  isDatabaseMode = false,
  onCreateRoot,
  onCreateChild,
  onEditProject,
  onDeleteProject,
  onDuplicateProject,
}: ProjectTreeProps) {
  const expandedProjectIds = useProjectStore((state) => state.expandedProjectIds);
  const selectProject = useProjectStore((state) => state.selectProject);
  const toggleProjectExpanded = useProjectStore((state) => state.toggleProjectExpanded);

  const tree = flattenProjects(projects);
  const hasChildren = (projectId: string) => projects.some((project) => project.parentId === projectId);

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-200/90 bg-gradient-to-r from-slate-50 to-white px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">프로젝트 트리</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">계층 구조와 진행 상태를 한 번에 관리합니다.</p>
          </div>
          <button
            type="button"
            onClick={onCreateRoot}
            className="rounded-2xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            + 루트
          </button>
        </div>
      </div>

      <div className="scroll-panel max-h-[calc(100vh-220px)] space-y-3 overflow-y-auto px-4 py-4">
        {tree.map((project) => {
          const childExists = hasChildren(project.id);
          const expanded = expandedProjectIds.includes(project.id);

          if (isProjectHiddenByCollapsedAncestor(projects, project, expandedProjectIds)) {
            return null;
          }

          return (
            <article
              key={project.id}
              className={cn(
                "relative rounded-[26px] border p-4 transition",
                selectedProjectId === project.id
                  ? "border-brand-300 bg-gradient-to-r from-brand-50 to-white shadow-[0_14px_32px_rgba(47,124,255,0.12)] dark:border-brand-700 dark:from-brand-950/20 dark:to-slate-950"
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
                  <button type="button" onClick={() => selectProject(project.id)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Level {project.depth}
                          </span>
                        </div>
                        <h3 className="mt-2 truncate text-[15px] font-semibold text-slate-900 dark:text-white">
                          {project.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                          {project.description}
                        </p>
                      </div>

                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                        {project.progress}%
                      </span>
                    </div>
                  </button>

                  <div className="mt-4">
                    <ProgressBar value={project.progress} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onCreateChild(project.id)}
                      disabled={project.depth >= 4}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      하위 추가
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditProject(project.id)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateProject(project.id)}
                      disabled={isDatabaseMode}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      복제
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("프로젝트와 하위 프로젝트, Task를 모두 삭제합니다. 계속할까요?")) {
                          onDeleteProject(project.id);
                        }
                      }}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/20 dark:hover:bg-rose-950/30"
                    >
                      삭제
                    </button>
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
