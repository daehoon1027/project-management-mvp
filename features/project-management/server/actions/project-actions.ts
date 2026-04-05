"use server";

import { createProject, deleteProject, updateProject } from "@/features/project-management/server/services/project.service";
import { isDatabaseConfigured } from "@/server/db/runtime";
import type { ProjectColor } from "@/types";

type ProjectActionResult = {
  ok: boolean;
  message?: string;
  projectId?: string;
};

const databaseNotReadyMessage = "DATABASE_URL이 아직 설정되지 않아 DB 저장을 진행할 수 없습니다.";

export async function createProjectAction(input: {
  name: string;
  description: string;
  parentId?: string | null;
  color?: ProjectColor;
}): Promise<ProjectActionResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: databaseNotReadyMessage };
  }

  try {
    const project = await createProject({
      ...input,
      currentUserId: "user-admin",
    });

    return { ok: true, projectId: project.id };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "프로젝트 생성 중 오류가 발생했습니다.",
    };
  }
}

export async function updateProjectAction(
  projectId: string,
  input: {
    name: string;
    description: string;
    color?: ProjectColor;
  },
): Promise<ProjectActionResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: databaseNotReadyMessage };
  }

  try {
    const project = await updateProject(projectId, {
      ...input,
      currentUserId: "user-admin",
    });

    return { ok: true, projectId: project.id };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "프로젝트 수정 중 오류가 발생했습니다.",
    };
  }
}

export async function deleteProjectAction(projectId: string): Promise<ProjectActionResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: databaseNotReadyMessage };
  }

  try {
    await deleteProject(projectId);
    return { ok: true, projectId };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "프로젝트 삭제 중 오류가 발생했습니다.",
    };
  }
}
