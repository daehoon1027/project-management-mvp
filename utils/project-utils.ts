import type { Project, ProjectSummary, Task } from "@/types";
import { getDescendantProjectIds } from "@/lib/project-tree";

export function getVisibleProjects(projects: Project[], tab: "active" | "archived") {
  return projects.filter((project) => (tab === "archived" ? project.isArchived : !project.isArchived));
}

export function getProjectsSortedForTree(projects: Project[]) {
  return [...projects].sort((left, right) => {
    if (left.isFavorite !== right.isFavorite) {
      return left.isFavorite ? -1 : 1;
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
}

export function getProjectSummary(projects: Project[], tasks: Task[], project: Project): ProjectSummary {
  const projectIds = [project.id, ...getDescendantProjectIds(projects, project.id)];
  const relatedTasks = tasks.filter((task) => projectIds.includes(task.projectId));

  return {
    project,
    totalTasks: relatedTasks.length,
    openTasks: relatedTasks.filter((task) => !task.isCompleted).length,
  };
}
