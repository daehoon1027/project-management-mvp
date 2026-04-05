import { revalidatePath } from "next/cache";
import { MAX_PROJECT_DEPTH } from "@/lib/constants";
import { cleanupProjectDependencies } from "@/server/repositories/project-management-cleanup.repository";
import { createProjectRecord, deleteProjectsByIds, getProjectById, listProjects, updateProjectRecord } from "@/server/repositories/project.repository";
import { deleteTasksByIds, listTasks } from "@/server/repositories/task.repository";
import { validateProjectName } from "@/features/project-management/server/validators/project.validator";
import type { ProjectColor } from "@/types";

type ProjectMutationInput = {
  name: string;
  description: string;
  color?: ProjectColor;
  parentId?: string | null;
  currentUserId?: string | null;
};

function getDescendantProjectIds(
  projects: Array<{
    id: string;
    parentId: string | null;
  }>,
  projectId: string,
): string[] {
  const childIds = projects.filter((project) => project.parentId === projectId).map((project) => project.id);
  return childIds.flatMap((childId) => [childId, ...getDescendantProjectIds(projects, childId)]);
}

export async function createProject(input: ProjectMutationInput) {
  const name = validateProjectName(input.name);
  const parentProject = input.parentId ? await getProjectById(input.parentId) : null;

  if (parentProject && parentProject.depth >= MAX_PROJECT_DEPTH) {
    throw new Error(`프로젝트는 최대 ${MAX_PROJECT_DEPTH}단계까지 생성할 수 있습니다.`);
  }

  const createdProject = await createProjectRecord({
    name,
    description: input.description.trim(),
    parentId: input.parentId ?? null,
    depth: parentProject ? parentProject.depth + 1 : 1,
    color: input.color ?? parentProject?.color ?? "blue",
    status: "active",
    departmentId: parentProject?.departmentId ?? null,
    ownerId: input.currentUserId ?? null,
    createdById: input.currentUserId ?? null,
    updatedById: input.currentUserId ?? null,
  });

  revalidatePath("/");
  return createdProject;
}

export async function updateProject(
  projectId: string,
  input: Pick<ProjectMutationInput, "name" | "description" | "color"> & { currentUserId?: string | null },
) {
  const name = validateProjectName(input.name);
  const updatedProject = await updateProjectRecord(projectId, {
    name,
    description: input.description.trim(),
    color: input.color,
    updatedById: input.currentUserId ?? null,
  });

  revalidatePath("/");
  return updatedProject;
}

export async function deleteProject(projectId: string) {
  const projects = await listProjects();
  const descendantProjectIds = getDescendantProjectIds(projects, projectId);
  const projectIds = [projectId, ...descendantProjectIds];
  const tasks = await listTasks();
  const taskIds = tasks.filter((task) => projectIds.includes(task.projectId)).map((task) => task.id);

  await cleanupProjectDependencies(projectIds, taskIds);
  if (taskIds.length > 0) {
    await deleteTasksByIds(taskIds);
  }
  await deleteProjectsByIds(projectIds.reverse());

  revalidatePath("/");
}
