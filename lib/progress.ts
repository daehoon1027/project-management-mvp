import type { Project, Task } from "@/types";

type ProjectRollup = {
  completed: number;
  total: number;
};

export function calculateProjectProgressMap(projects: Project[], tasks: Task[]) {
  const childrenMap = new Map<string | null, Project[]>();
  const taskMap = new Map<string, Task[]>();
  const progressMap = new Map<string, number>();
  const rollupMap = new Map<string, ProjectRollup>();

  for (const project of projects) {
    const siblings = childrenMap.get(project.parentId) ?? [];
    siblings.push(project);
    childrenMap.set(project.parentId, siblings);
  }

  for (const task of tasks) {
    const projectTasks = taskMap.get(task.projectId) ?? [];
    projectTasks.push(task);
    taskMap.set(task.projectId, projectTasks);
  }

  const walk = (project: Project): ProjectRollup => {
    const ownTasks = taskMap.get(project.id) ?? [];
    let completed = ownTasks.filter((task) => task.isCompleted).length;
    let total = ownTasks.length;

    for (const child of childrenMap.get(project.id) ?? []) {
      const childRollup = walk(child);
      completed += childRollup.completed;
      total += childRollup.total;
    }

    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    progressMap.set(project.id, progress);
    rollupMap.set(project.id, { completed, total });

    return { completed, total };
  };

  for (const rootProject of childrenMap.get(null) ?? []) {
    walk(rootProject);
  }

  return { progressMap, rollupMap };
}

export function applyProjectProgress(projects: Project[], tasks: Task[]) {
  const { progressMap } = calculateProjectProgressMap(projects, tasks);

  return projects.map((project) => ({
    ...project,
    progress: progressMap.get(project.id) ?? 0,
  }));
}
