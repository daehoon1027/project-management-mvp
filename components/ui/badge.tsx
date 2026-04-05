import type { Priority, TaskStatus } from "@/types";
import { cn, getPriorityLabel, getStatusLabel } from "@/lib/utils";

type StatusBadgeProps = {
  status: TaskStatus;
  className?: string;
};

type PriorityBadgeProps = {
  priority: Priority;
  className?: string;
};

const statusToneMap: Record<TaskStatus, string> = {
  planned:
    "bg-slate-100/90 text-slate-700 ring-1 ring-inset ring-slate-200 shadow-sm dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
  in_progress:
    "bg-sky-100/90 text-sky-700 ring-1 ring-inset ring-sky-200 shadow-sm dark:bg-sky-950/70 dark:text-sky-300 dark:ring-sky-900",
  in_review:
    "bg-violet-100/90 text-violet-700 ring-1 ring-inset ring-violet-200 shadow-sm dark:bg-violet-950/70 dark:text-violet-300 dark:ring-violet-900",
  approval_pending:
    "bg-fuchsia-100/90 text-fuchsia-700 ring-1 ring-inset ring-fuchsia-200 shadow-sm dark:bg-fuchsia-950/70 dark:text-fuchsia-300 dark:ring-fuchsia-900",
  done:
    "bg-emerald-100/90 text-emerald-700 ring-1 ring-inset ring-emerald-200 shadow-sm dark:bg-emerald-950/70 dark:text-emerald-300 dark:ring-emerald-900",
  on_hold:
    "bg-amber-100/90 text-amber-700 ring-1 ring-inset ring-amber-200 shadow-sm dark:bg-amber-950/70 dark:text-amber-300 dark:ring-amber-900",
};

const priorityToneMap: Record<Priority, string> = {
  low:
    "bg-slate-100/90 text-slate-700 ring-1 ring-inset ring-slate-200 shadow-sm dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
  medium:
    "bg-cyan-100/90 text-cyan-700 ring-1 ring-inset ring-cyan-200 shadow-sm dark:bg-cyan-950/70 dark:text-cyan-300 dark:ring-cyan-900",
  high:
    "bg-orange-100/90 text-orange-700 ring-1 ring-inset ring-orange-200 shadow-sm dark:bg-orange-950/70 dark:text-orange-300 dark:ring-orange-900",
  urgent:
    "bg-rose-100/90 text-rose-700 ring-1 ring-inset ring-rose-200 shadow-sm dark:bg-rose-950/70 dark:text-rose-300 dark:ring-rose-900",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide",
        statusToneMap[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
      {getStatusLabel(status)}
    </span>
  );
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide",
        priorityToneMap[priority],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
      {getPriorityLabel(priority)}
    </span>
  );
}
