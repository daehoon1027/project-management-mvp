"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
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

type ProjectMapPanel = "children" | "tasks" | "open" | null;

function sortProjects(items: Project[]) {
  return [...items].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

function sortTasks(items: Task[]) {
  return [...items].sort((left, right) => {
    if (left.isCompleted !== right.isCompleted) {
      return left.isCompleted ? 1 : -1;
    }

    return left.dueDate.localeCompare(right.dueDate);
  });
}

function formatTaskDueDate(dueDate: string) {
  if (!dueDate) {
    return "마감일 없음";
  }

  const [year, month, day] = dueDate.split("-");

  if (!year || !month || !day) {
    return dueDate;
  }

  return `${year}.${month}.${day}`;
}

export function ProjectTree({
  projects,
  tasks,
  selectedProjectId,
  isDatabaseMode: _isDatabaseMode = false,
  onDeleteProject: _onDeleteProject,
  onDuplicateProject: _onDuplicateProject,
}: ProjectTreeProps) {
  const selectProject = useProjectStore((state) => state.selectProject);
  const [openPanelByProjectId, setOpenPanelByProjectId] = useState<Record<string, ProjectMapPanel>>({});

  const rootProjects = useMemo(() => sortProjects(projects.filter((project) => project.parentId === null)), [projects]);

  const childProjectsByParentId = useMemo(() => {
    const nextMap = new Map<string, Project[]>();

    for (const project of sortProjects(projects)) {
      if (!project.parentId) {
        continue;
      }

      const current = nextMap.get(project.parentId) ?? [];
      current.push(project);
      nextMap.set(project.parentId, current);
    }

    return nextMap;
  }, [projects]);

  const directTasksByProjectId = useMemo(() => {
    const nextMap = new Map<string, Task[]>();

    for (const task of sortTasks(tasks)) {
      const current = nextMap.get(task.projectId) ?? [];
      current.push(task);
      nextMap.set(task.projectId, current);
    }

    return nextMap;
  }, [tasks]);

  const togglePanel = (projectId: string, panel: Exclude<ProjectMapPanel, null>) => {
    setOpenPanelByProjectId((current) => ({
      ...current,
      [projectId]: current[projectId] === panel ? null : panel,
    }));
  };

  const renderTaskList = (items: Task[], emptyMessage: string) => {
    if (items.length === 0) {
      return (
        <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((task) => (
          <div
            key={task.id}
            className="rounded-[18px] border border-slate-200/90 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{task.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{task.assignee.trim() || "담당자 미지정"}</span>
                  <span>•</span>
                  <span>{formatTaskDueDate(task.dueDate)}</span>
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  task.isCompleted
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
                )}
              >
                {task.isCompleted ? "완료" : "진행 중"}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderProjectNode = (project: Project, nested = false): ReactNode => {
    const childProjects = childProjectsByParentId.get(project.id) ?? [];
    const directTasks = directTasksByProjectId.get(project.id) ?? [];
    const openTasks = directTasks.filter((task) => !task.isCompleted);
    const openPanel = openPanelByProjectId[project.id] ?? null;

    return (
      <article
        key={project.id}
        className={cn(
          "rounded-[24px] border p-4 transition",
          nested ? "bg-slate-50/80 dark:bg-slate-950/60" : "bg-white dark:bg-slate-950",
          selectedProjectId === project.id
            ? "border-brand-400 shadow-[0_16px_36px_rgba(47,124,255,0.14)] dark:border-brand-700"
            : "border-slate-200/90 dark:border-slate-800",
        )}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Level {project.depth}
              </span>
              <button
                type="button"
                onClick={() => togglePanel(project.id, "children")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                  openPanel === "children"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
                )}
              >
                하위 {childProjects.length}
              </button>
              <button
                type="button"
                onClick={() => togglePanel(project.id, "tasks")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                  openPanel === "tasks"
                    ? "bg-brand-600 text-white dark:bg-brand-500 dark:text-white"
                    : "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20",
                )}
              >
                Task {directTasks.length}
              </button>
              <button
                type="button"
                onClick={() => togglePanel(project.id, "open")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                  openPanel === "open"
                    ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-slate-950"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20",
                )}
              >
                미완료 {openTasks.length}
              </button>
            </div>

            <button type="button" onClick={() => selectProject(project.id)} className="mt-3 block w-full text-left">
              <h3 className="text-[22px] font-semibold tracking-tight text-slate-900 dark:text-white">{project.name}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{project.description || "프로젝트 설명 없음"}</p>
            </button>
          </div>

          <div className="min-w-[220px] rounded-[20px] border border-slate-200/80 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-500 dark:text-slate-400">
              <span>진행률</span>
              <span>{project.progress}%</span>
            </div>
            <ProgressBar value={project.progress} />
          </div>
        </div>

        {openPanel ? (
          <div className="mt-4 border-t border-slate-200/90 pt-4 dark:border-slate-800">
            {openPanel === "children" ? (
              childProjects.length > 0 ? (
                <div className="space-y-3">{childProjects.map((childProject) => renderProjectNode(childProject, true))}</div>
              ) : (
                <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                  하위 프로젝트가 없습니다.
                </div>
              )
            ) : openPanel === "tasks" ? (
              renderTaskList(directTasks, "직속 Task가 없습니다.")
            ) : (
              renderTaskList(openTasks, "미완료 Task가 없습니다.")
            )}
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-200/90 bg-gradient-to-r from-slate-50 to-white px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">프로젝트 맵</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">처음엔 루트 프로젝트만 보여주고, 필요한 하위 구조와 Task만 바로 아래에서 펼쳐봅니다.</p>
        </div>
      </div>

      <div className="scroll-panel max-h-[calc(100vh-220px)] space-y-3 overflow-y-auto px-4 py-4">
        {rootProjects.length > 0 ? (
          rootProjects.map((project) => renderProjectNode(project))
        ) : (
          <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
            표시할 루트 프로젝트가 없습니다.
          </div>
        )}
      </div>
    </Card>
  );
}
