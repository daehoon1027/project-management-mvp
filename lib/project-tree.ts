import type { Project } from "@/types";

export function getDescendantProjectIds(projects: Project[], projectId: string): string[] {
  const childIds = projects.filter((project) => project.parentId === projectId).map((project) => project.id);
  return childIds.flatMap((childId) => [childId, ...getDescendantProjectIds(projects, childId)]);
}

export function getAncestorProjectIds(projects: Project[], projectId: string | null): string[] {
  if (!projectId) {
    return [];
  }

  const currentProject = projects.find((project) => project.id === projectId);

  if (!currentProject) {
    return [];
  }

  return [currentProject.id, ...getAncestorProjectIds(projects, currentProject.parentId)];
}

export function flattenProjects(projects: Project[], parentId: string | null = null): Project[] {
  return projects
    .filter((project) => project.parentId === parentId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .flatMap((project) => [project, ...flattenProjects(projects, project.id)]);
}

export function getProjectPath(projects: Project[], projectId: string | null): Project[] {
  if (!projectId) {
    return [];
  }

  const current = projects.find((project) => project.id === projectId);

  if (!current) {
    return [];
  }

  return [...getProjectPath(projects, current.parentId), current];
}

export function isProjectHiddenByCollapsedAncestor(
  projects: Project[],
  project: Project,
  expandedProjectIds: string[],
): boolean {
  if (!project.parentId) {
    return false;
  }

  if (!expandedProjectIds.includes(project.parentId)) {
    return true;
  }

  const parentProject = projects.find((candidate) => candidate.id === project.parentId);
  return parentProject
    ? isProjectHiddenByCollapsedAncestor(projects, parentProject, expandedProjectIds)
    : false;
}
