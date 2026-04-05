import type { AssigneeSummary, ChecklistItem, Priority, Task, TaskFilters } from "@/types";
import { getDeadlineStatus, getTodayString, isWithinCurrentWeek } from "@/utils/date-utils";

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase();
}

function getPriorityRank(priority: Priority) {
  const rankMap: Record<Priority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return rankMap[priority];
}

export function getTaskSearchText(task: Task) {
  return [task.title, task.description, task.assignee, task.memo, ...task.checklist.map((item) => item.text)]
    .join(" ")
    .toLowerCase();
}

export function filterTasksAdvanced(tasks: Task[], filters: TaskFilters) {
  const keyword = normalizeKeyword(filters.query);
  const assigneeKeyword = normalizeKeyword(filters.assignee);

  return tasks.filter((task) => {
    const matchesQuery = keyword.length === 0 || getTaskSearchText(task).includes(keyword);
    const matchesCompleted =
      filters.completed === "all" || (filters.completed === "done" ? task.isCompleted : !task.isCompleted);
    const matchesStatus = filters.status === "all" || task.status === filters.status;
    const matchesPriority = filters.priority === "all" || task.priority === filters.priority;
    const matchesAssignee = assigneeKeyword.length === 0 || task.assignee.toLowerCase().includes(assigneeKeyword);
    const matchesHideCompleted = !filters.hideCompleted || !task.isCompleted;

    return (
      matchesQuery &&
      matchesCompleted &&
      matchesStatus &&
      matchesPriority &&
      matchesAssignee &&
      matchesHideCompleted
    );
  });
}

export function sortTasksAdvanced(tasks: Task[], sortBy: TaskFilters["sortBy"]) {
  return [...tasks].sort((left, right) => {
    if (sortBy === "priority") {
      return getPriorityRank(left.priority) - getPriorityRank(right.priority);
    }

    if (sortBy === "updatedAt") {
      return right.updatedAt.localeCompare(left.updatedAt);
    }

    if (sortBy === "title") {
      return left.title.localeCompare(right.title);
    }

    return (left.dueDate || "9999-12-31").localeCompare(right.dueDate || "9999-12-31");
  });
}

export function getSubtasks(tasks: Task[], parentTaskId: string | null) {
  return tasks.filter((task) => task.parentTaskId === parentTaskId);
}

export function createChecklistItem(text: string, createdAt: string, id: string): ChecklistItem {
  return {
    id,
    text,
    isCompleted: false,
    createdAt,
  };
}

export function getTodayTasks(tasks: Task[]) {
  const today = getTodayString();

  return tasks.filter((task) => {
    if (task.isCompleted) {
      return false;
    }

    if (task.startDate === today || task.dueDate === today) {
      return true;
    }

    return Boolean(task.startDate && task.dueDate && task.startDate <= today && task.dueDate >= today);
  });
}

export function getWeekDueTasks(tasks: Task[]) {
  return tasks.filter((task) => !task.isCompleted && isWithinCurrentWeek(task.dueDate));
}

export function getOverdueTasks(tasks: Task[]) {
  return tasks.filter((task) => getDeadlineStatus(task) === "overdue");
}

export function getAssigneeSummary(tasks: Task[]): AssigneeSummary[] {
  const map = new Map<string, AssigneeSummary>();

  for (const task of tasks) {
    const assignee = task.assignee.trim() || "미지정";
    const current = map.get(assignee) ?? {
      assignee,
      total: 0,
      done: 0,
      overdue: 0,
      dueSoon: 0,
    };

    current.total += 1;
    if (task.isCompleted) {
      current.done += 1;
    }

    const deadlineStatus = getDeadlineStatus(task);
    if (deadlineStatus === "overdue") {
      current.overdue += 1;
    }
    if (deadlineStatus === "due_soon") {
      current.dueSoon += 1;
    }

    map.set(assignee, current);
  }

  return [...map.values()].sort((left, right) => right.total - left.total);
}
