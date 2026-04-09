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
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="hidden grid-cols-[minmax(0,1.8fr)_140px_120px_100px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 md:grid">
          <span>Task</span>
          <span>담당자</span>
          <span>마감</span>
          <span>상태</span>
        </div>
        <div className="divide-y divide-slate-200">
          {items.map((task) => (
            <div key={task.id} className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,1.8fr)_140px_120px_100px] md:items-center md:gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{task.title}</p>
                <p className="mt-1 text-xs text-slate-500 md:hidden">{task.assignee.trim() || "담당자 미지정"}</p>
              </div>
              <p className="hidden text-sm text-slate-600 md:block">{task.assignee.trim() || "담당자 미지정"}</p>
              <p className="text-sm text-slate-600">{formatTaskDueDate(task.dueDate)}</p>
              <span
                className={cn(
                  "w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  task.isCompleted ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
                )}
              >
                {task.isCompleted ? "완료" : "진행중"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProjectRow = (project: Project, nested = false): ReactNode => {
    const childProjects = childProjectsByParentId.get(project.id) ?? [];
    const directTasks = directTasksByProjectId.get(project.id) ?? [];
    const openTasks = directTasks.filter((task) => !task.isCompleted);
    const openPanel = openPanelByProjectId[project.id] ?? null;

    return (
      <div key={project.id} className={cn("space-y-3", nested ? "pl-4" : undefined)}>
        <div
          className={cn(
            "grid gap-4 rounded-2xl border px-4 py-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(220px,0.9fr)_auto] xl:items-center",
            selectedProjectId === project.id ? "border-brand-400 bg-brand-50/40" : "border-slate-200 bg-white",
          )}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Depth {project.depth}
              </span>
              <button type="button" onClick={() => selectProject(project.id)} className="truncate text-left text-lg font-semibold text-slate-900">
                {project.name}
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">{project.description || "프로젝트 설명 없음"}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>진행률</span>
              <span>{project.progress}%</span>
            </div>
            <ProgressBar value={project.progress} />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => togglePanel(project.id, "children")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                openPanel === "children"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
            >
              하위 {childProjects.length}
            </button>
            <button
              type="button"
              onClick={() => togglePanel(project.id, "tasks")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                openPanel === "tasks"
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
            >
              Task {directTasks.length}
            </button>
            <button
              type="button"
              onClick={() => togglePanel(project.id, "open")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                openPanel === "open"
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
            >
              미완료 {openTasks.length}
            </button>
          </div>
        </div>

        {openPanel ? (
          <div className={cn("border-l-2 border-slate-200 pl-4", nested ? "ml-2" : undefined)}>
            {openPanel === "children" ? (
              childProjects.length > 0 ? (
                <div className="space-y-3">{childProjects.map((childProject) => renderProjectRow(childProject, true))}</div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
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
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border-slate-200 bg-white p-0">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">프로젝트 맵</h2>
        <p className="mt-1 text-sm text-slate-500">
          카드 대신 행 기반 트리로 정리해 프로젝트가 많아져도 한 눈에 구조를 읽을 수 있게 했습니다.
        </p>
      </div>

      <div className="hidden grid-cols-[minmax(0,1.8fr)_minmax(220px,0.9fr)_auto] gap-4 border-b border-slate-200 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 xl:grid">
        <span>프로젝트</span>
        <span>진행률</span>
        <span>세부 보기</span>
      </div>

      <div className="scroll-panel max-h-[calc(100vh-220px)] space-y-4 overflow-y-auto px-5 py-4">
        {rootProjects.length > 0 ? (
          rootProjects.map((project) => renderProjectRow(project))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            표시할 루트 프로젝트가 없습니다.
          </div>
        )}
      </div>
    </Card>
  );
}
