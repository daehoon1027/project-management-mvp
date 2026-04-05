import type { DeadlineStatus, Task } from "@/types";

export function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getDateDiffInDays(date: string) {
  if (!date) {
    return null;
  }

  const target = startOfDay(new Date(date));
  const today = startOfDay(new Date());

  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDeadlineStatus(task: Task): DeadlineStatus {
  if (task.isCompleted || !task.dueDate) {
    return "none";
  }

  const diff = getDateDiffInDays(task.dueDate);

  if (diff === null) {
    return "none";
  }

  if (diff < 0) {
    return "overdue";
  }

  if (diff <= 3) {
    return "due_soon";
  }

  return "upcoming";
}

export function isWithinCurrentWeek(date: string) {
  if (!date) {
    return false;
  }

  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset));
  const weekEnd = startOfDay(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6));
  const target = startOfDay(new Date(date));

  return target >= weekStart && target <= weekEnd;
}

export function getMonthMatrix(baseDate = new Date()) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const offset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const firstCell = new Date(year, month, 1 - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCell);
    date.setDate(firstCell.getDate() + index);
    return date;
  });
}
