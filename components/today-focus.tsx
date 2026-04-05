import { Card } from "@/components/ui/card";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { formatDate, formatRelativeDateLabel, isTodayTask } from "@/lib/utils";
import type { Project, Task } from "@/types";

type TodayFocusProps = {
  projects: Project[];
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
};

export function TodayFocus({ projects, tasks, onOpenTask }: TodayFocusProps) {
  const todaysTasks = tasks
    .filter((task) => isTodayTask(task))
    .sort((left, right) => (left.dueDate || "9999-12-31").localeCompare(right.dueDate || "9999-12-31"))
    .slice(0, 5);

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">오늘 할 일</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">오늘 움직여야 할 일정과 마감 항목을 바로 확인합니다.</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          {todaysTasks.length}개
        </span>
      </div>

      <div className="space-y-3">
        {todaysTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            오늘 집중해야 할 Task가 없습니다.
          </div>
        ) : (
          todaysTasks.map((task) => {
            const project = projects.find((item) => item.id === task.projectId);

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onOpenTask(task.id)}
                className="flex w-full items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700 dark:hover:bg-slate-800"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{task.title}</span>
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{project?.name ?? "프로젝트 없음"}</p>
                </div>
                <div className="text-right text-sm text-slate-500 dark:text-slate-400">
                  <p>{formatDate(task.dueDate)}</p>
                  <p>{formatRelativeDateLabel(task.dueDate)}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
}
