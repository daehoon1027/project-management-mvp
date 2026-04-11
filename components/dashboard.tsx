"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getDescendantProjectIds } from "@/lib/project-tree";
import { isDueSoon, cn } from "@/lib/utils";
import type { Project, Task } from "@/types";

type DashboardProps = {
  projects: Project[];
  tasks: Task[];
  onExportAllTasks?: () => void;
};

type OverviewPanel = "children" | "tasks" | "open" | null;

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

export function Dashboard({ projects, tasks, onExportAllTasks }: DashboardProps) {
  const [openPanelByProjectId, setOpenPanelByProjectId] = useState<Record<string, OverviewPanel>>({});

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

  const tasksByProjectId = useMemo(() => {
    const nextMap = new Map<string, Task[]>();

    for (const task of sortTasks(tasks)) {
      const current = nextMap.get(task.projectId) ?? [];
      current.push(task);
      nextMap.set(task.projectId, current);
    }

    return nextMap;
  }, [tasks]);

  const inProgressTasks = tasks.filter((task) => task.status === "in_progress" && !task.isCompleted).length;
  const completedTasks = tasks.filter((task) => task.isCompleted).length;
  const dueSoonTasks = tasks.filter((task) => isDueSoon(task)).length;

  const summaryItems = [
    { label: "전체 프로젝트", value: projects.length, description: "트리 전체 기준" },
    { label: "진행중 Task", value: inProgressTasks, description: "현재 실행 중" },
    { label: "완료 Task", value: completedTasks, description: "완료 처리 항목" },
    { label: "마감 임박", value: dueSoonTasks, description: "3일 이내 종료 예정" },
  ];

  const togglePanel = (projectId: string, panel: Exclude<OverviewPanel, null>) => {
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

  const renderChildProjectList = (items: Project[]) => {
    if (items.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
          하위 프로젝트가 없습니다.
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="hidden grid-cols-[minmax(0,1.8fr)_140px_100px_100px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 md:grid">
          <span>하위 프로젝트</span>
          <span>진행률</span>
          <span>깊이</span>
          <span>상태</span>
        </div>
        <div className="divide-y divide-slate-200">
          {items.map((project) => (
            <div key={project.id} className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,1.8fr)_140px_100px_100px] md:items-center md:gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{project.name}</p>
                <p className="truncate text-xs text-slate-500">{project.description || "설명 없음"}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>진행률</span>
                  <span>{project.progress}%</span>
                </div>
                <ProgressBar value={project.progress} />
              </div>
              <p className="text-sm text-slate-600">Depth {project.depth}</p>
              <p className="text-sm text-slate-600">{project.progress === 100 ? "완료" : "진행중"}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-3">
      <Card className="space-y-3 border-slate-200 bg-white">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">운영 요약</h2>
            <p className="text-sm text-slate-500">프로젝트와 Task 전체 상태를 압축해서 확인합니다.</p>
          </div>
          {onExportAllTasks ? (
            <button
              type="button"
              onClick={onExportAllTasks}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              전체 CSV 다운로드
            </button>
          ) : null}
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{item.value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden border-slate-200 bg-white p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-900">프로젝트 진행 현황</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            루트 프로젝트별로 전체 Task, 미완료 Task, 하위 프로젝트를 바로 펼쳐서 확인합니다.
          </p>
        </div>

        <div className="hidden grid-cols-[minmax(0,1.8fr)_minmax(220px,0.9fr)_auto] gap-3 border-b border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 xl:grid">
          <span>프로젝트</span>
          <span>진행률</span>
          <span>세부 보기</span>
        </div>

        <div className="divide-y divide-slate-200">
          {rootProjects.map((project) => {
            const relatedProjectIds = [project.id, ...getDescendantProjectIds(projects, project.id)];
            const relatedTasks = sortTasks(tasks.filter((task) => relatedProjectIds.includes(task.projectId)));
            const openTasks = relatedTasks.filter((task) => !task.isCompleted);
            const childProjects = childProjectsByParentId.get(project.id) ?? [];
            const openPanel = openPanelByProjectId[project.id] ?? null;

            return (
              <article key={project.id} className="px-4 py-3">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.8fr)_minmax(220px,0.9fr)_auto] xl:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Depth {project.depth}
                      </span>
                      <h3 className="truncate text-base font-semibold text-slate-900">{project.name}</h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{project.description || "프로젝트 설명 없음"}</p>
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
                      onClick={() => togglePanel(project.id, "tasks")}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                        openPanel === "tasks"
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      전체 Task {relatedTasks.length}
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
                      미완료 Task {openTasks.length}
                    </button>
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
                      하위 프로젝트 {childProjects.length}
                    </button>
                  </div>
                </div>

                {openPanel ? (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    {openPanel === "children"
                      ? renderChildProjectList(childProjects)
                      : openPanel === "tasks"
                        ? renderTaskList(relatedTasks, "연결된 Task가 없습니다.")
                        : renderTaskList(openTasks, "미완료 Task가 없습니다.")}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
