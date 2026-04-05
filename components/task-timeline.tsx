import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Task } from "@/types";

type TaskTimelineProps = {
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
};

function getTimelineDateRange(tasks: Task[]) {
  const datedTasks = tasks.filter((task) => task.startDate || task.dueDate);
  const fallback = new Date().toISOString().slice(0, 10);
  const dates = datedTasks.flatMap((task) => [task.startDate || fallback, task.dueDate || task.startDate || fallback]);

  if (dates.length === 0) {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      return date.toISOString().slice(0, 10);
    });
  }

  const start = new Date(dates.sort()[0]);
  const end = new Date(dates.sort().at(-1)!);
  const days = Math.max(7, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export function TaskTimeline({ tasks, onOpenTask }: TaskTimelineProps) {
  const timelineDates = getTimelineDateRange(tasks);

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="grid border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950" style={{ gridTemplateColumns: `280px repeat(${timelineDates.length}, minmax(64px, 1fr))` }}>
            <div className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">Task</div>
            {timelineDates.map((date) => (
              <div key={date} className="border-l border-slate-200 px-2 py-3 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {date.slice(5)}
              </div>
            ))}
          </div>

          {tasks.map((task) => {
            const startDate = task.startDate || task.dueDate || timelineDates[0];
            const dueDate = task.dueDate || task.startDate || timelineDates[0];
            const startIndex = Math.max(timelineDates.indexOf(startDate), 0);
            const endIndex = Math.max(timelineDates.indexOf(dueDate), startIndex);

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onOpenTask(task.id)}
                className="grid w-full border-b border-slate-200 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                style={{ gridTemplateColumns: `280px repeat(${timelineDates.length}, minmax(64px, 1fr))` }}
              >
                <div className="px-4 py-4">
                  <p className="font-semibold text-slate-900 dark:text-white">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(startDate)} ~ {formatDate(dueDate)}
                  </p>
                </div>

                {timelineDates.map((date, index) => {
                  const active = index >= startIndex && index <= endIndex;

                  return (
                    <div key={`${task.id}-${date}`} className="border-l border-slate-200 px-1 py-3 dark:border-slate-800">
                      <div
                        className={`h-7 rounded-full ${active ? "bg-gradient-to-r from-brand-500 to-sky-500" : "bg-transparent"}`}
                      />
                    </div>
                  );
                })}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
