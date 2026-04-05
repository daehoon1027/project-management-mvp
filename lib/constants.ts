import type { DetailViewMode, Priority, ProjectColor, TaskFilters, TaskStatus } from "@/types";

export const MAX_PROJECT_DEPTH = 4;

export const priorityOptions: Array<{ value: Priority; label: string }> = [
  { value: "low", label: "낮음" },
  { value: "medium", label: "보통" },
  { value: "high", label: "높음" },
  { value: "urgent", label: "긴급" },
];

export const statusOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: "planned", label: "예정" },
  { value: "in_progress", label: "진행중" },
  { value: "in_review", label: "검토중" },
  { value: "approval_pending", label: "승인대기" },
  { value: "done", label: "완료" },
  { value: "on_hold", label: "보류" },
];

export const detailViewOptions: Array<{ value: DetailViewMode; label: string }> = [
  { value: "list", label: "리스트" },
  { value: "board", label: "보드" },
  { value: "calendar", label: "캘린더" },
  { value: "timeline", label: "간트" },
];

export const projectColorOptions: Array<{ value: ProjectColor; label: string; dotClassName: string }> = [
  { value: "slate", label: "Slate", dotClassName: "bg-slate-500" },
  { value: "blue", label: "Blue", dotClassName: "bg-blue-500" },
  { value: "emerald", label: "Emerald", dotClassName: "bg-emerald-500" },
  { value: "amber", label: "Amber", dotClassName: "bg-amber-500" },
  { value: "rose", label: "Rose", dotClassName: "bg-rose-500" },
  { value: "violet", label: "Violet", dotClassName: "bg-violet-500" },
  { value: "cyan", label: "Cyan", dotClassName: "bg-cyan-500" },
];

export const defaultTaskFilters: TaskFilters = {
  query: "",
  completed: "all",
  status: "all",
  priority: "all",
  assignee: "",
  sortBy: "dueDate",
  hideCompleted: false,
};
