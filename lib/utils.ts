import { clsx } from "clsx";
import { projectColorOptions } from "@/lib/constants";
import { filterTasksAdvanced, sortTasksAdvanced } from "@/utils/task-utils";
import { getDeadlineStatus } from "@/utils/date-utils";
import type { Priority, ProjectColor, Task, TaskFilters, TaskStatus } from "@/types";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function generateId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
}

export function formatDate(date: string) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

export function formatDateTime(date: string) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelativeDateLabel(date: string) {
  if (!date) {
    return "-";
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(date);
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "오늘";
  }

  if (diffDays === 1) {
    return "내일";
  }

  if (diffDays === -1) {
    return "어제";
  }

  if (diffDays > 1) {
    return `${diffDays}일 후`;
  }

  return `${Math.abs(diffDays)}일 지연`;
}

export function getPriorityLabel(priority: Priority) {
  const labelMap: Record<Priority, string> = {
    low: "낮음",
    medium: "보통",
    high: "높음",
    urgent: "긴급",
  };

  return labelMap[priority];
}

export function getStatusLabel(status: TaskStatus) {
  const labelMap: Record<TaskStatus, string> = {
    planned: "예정",
    in_progress: "진행중",
    in_review: "검토중",
    approval_pending: "승인대기",
    done: "완료",
    on_hold: "보류",
  };

  return labelMap[status];
}

export function getPriorityRank(priority: Priority) {
  const rankMap: Record<Priority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return rankMap[priority];
}

export function getProjectColorMeta(color: ProjectColor) {
  return (
    projectColorOptions.find((option) => option.value === color) ?? {
      value: "slate" as const,
      label: "Slate",
      dotClassName: "bg-slate-500",
    }
  );
}

export function isDueSoon(task: Task) {
  return getDeadlineStatus(task) === "due_soon";
}

export function isOverdue(task: Task) {
  return getDeadlineStatus(task) === "overdue";
}

export function isTodayTask(task: Task) {
  if (task.isCompleted) {
    return false;
  }

  const today = new Date().toISOString().slice(0, 10);

  if (task.startDate === today || task.dueDate === today) {
    return true;
  }

  if (task.startDate && task.dueDate) {
    return task.startDate <= today && today <= task.dueDate;
  }

  return false;
}

export function sortTasks(tasks: Task[], sortBy: TaskFilters["sortBy"]) {
  return sortTasksAdvanced(tasks, sortBy);
}

export function filterTasks(tasks: Task[], filters: TaskFilters) {
  return filterTasksAdvanced(tasks, filters);
}
