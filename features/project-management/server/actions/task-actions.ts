"use server";

import { addComment, createTask, deleteTask, updateTask } from "@/features/project-management/server/services/task.service";
import { isDatabaseConfigured } from "@/server/db/runtime";
import type { TaskInput, TaskPatch } from "@/types";

type TaskActionResult = {
  ok: boolean;
  message?: string;
  taskId?: string;
};

const databaseNotReadyMessage = "DATABASE_URL이 아직 설정되지 않아 DB 저장을 진행할 수 없습니다.";

export async function createTaskAction(projectId: string, input: TaskInput): Promise<TaskActionResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: databaseNotReadyMessage };
  }

  try {
    const task = await createTask(projectId, input, "user-admin");
    return { ok: true, taskId: task.id };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Task 생성 중 오류가 발생했습니다.",
    };
  }
}

export async function updateTaskAction(taskId: string, input: TaskPatch): Promise<TaskActionResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: databaseNotReadyMessage };
  }

  try {
    const task = await updateTask(taskId, input, "user-admin");
    return { ok: true, taskId: task.id };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Task 수정 중 오류가 발생했습니다.",
    };
  }
}

export async function deleteTaskAction(taskId: string): Promise<TaskActionResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: databaseNotReadyMessage };
  }

  try {
    await deleteTask(taskId);
    return { ok: true, taskId };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Task 삭제 중 오류가 발생했습니다.",
    };
  }
}

export async function addCommentAction(taskId: string, body: string): Promise<TaskActionResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: databaseNotReadyMessage };
  }

  try {
    await addComment(taskId, body, "user-admin");
    return { ok: true, taskId };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "댓글 저장 중 오류가 발생했습니다.",
    };
  }
}
