import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getDescendantProjectIds } from "@/lib/project-tree";
import { isDueSoon } from "@/lib/utils";
import type { Project, Task } from "@/types";

type DashboardProps = {
  projects: Project[];
  tasks: Task[];
};

export function Dashboard({ projects, tasks }: DashboardProps) {
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress" && !task.isCompleted).length;
  const completedTasks = tasks.filter((task) => task.isCompleted).length;
  const dueSoonTasks = tasks.filter((task) => isDueSoon(task)).length;
  const rootProjects = projects.filter((project) => project.parentId === null);

  const summaryCards = [
    {
      label: "전체 프로젝트",
      value: projects.length,
      description: "트리 전체 기준",
      tone: "from-slate-950 via-slate-900 to-slate-800 text-white",
    },
    {
      label: "진행중 Task",
      value: inProgressTasks,
      description: "현재 실행 중 업무",
      tone: "from-brand-700 via-brand-600 to-sky-500 text-white",
    },
    {
      label: "완료 Task",
      value: completedTasks,
      description: "완료 처리된 항목",
      tone: "from-emerald-600 via-emerald-500 to-teal-400 text-white",
    },
    {
      label: "마감 임박",
      value: dueSoonTasks,
      description: "3일 이내 종료 예정",
      tone: "from-amber-300 via-amber-400 to-orange-400 text-slate-950",
    },
  ];

  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br p-5 shadow-[0_20px_45px_rgba(15,23,42,0.14)] ${card.tone}`}
          >
            <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="relative space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium opacity-85">{card.label}</p>
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] opacity-80">
                  KPI
                </span>
              </div>
              <p className="text-4xl font-semibold tracking-tight">{card.value}</p>
              <p className="text-sm opacity-80">{card.description}</p>
            </div>
          </article>
        ))}
      </div>

      <Card className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">프로젝트 진행 현황</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              각 상위 프로젝트의 실질 진행 상태와 남은 업무량을 카드형으로 확인할 수 있습니다.
            </p>
          </div>
          <p className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            기준: 하위 트리 전체 Task 완료 비율
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {rootProjects.map((project) => {
            const relatedProjectIds = [project.id, ...getDescendantProjectIds(projects, project.id)];
            const relatedTasks = tasks.filter((task) => relatedProjectIds.includes(task.projectId));
            const openTasks = relatedTasks.filter((task) => !task.isCompleted).length;

            return (
              <article
                key={project.id}
                className="rounded-[28px] border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                      <h3 className="font-semibold text-slate-900 dark:text-white">{project.name}</h3>
                    </div>
                    <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">{project.description}</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    {project.progress}%
                  </span>
                </div>

                <div className="mt-5">
                  <ProgressBar value={project.progress} label="진행률" />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-slate-500 dark:text-slate-400">전체 Task</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">{relatedTasks.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-slate-500 dark:text-slate-400">미완료 Task</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">{openTasks}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
