import { revalidatePath } from "next/cache";
import { cleanupTaskDependencies, createCommentRecord } from "@/server/repositories/project-management-cleanup.repository";
import { createTaskRecord, deleteTasksByIds, listTasks, updateTaskRecord } from "@/server/repositories/task.repository";
import { resolveActorUserId } from "@/server/repositories/user.repository";
import { validateTaskTitle } from "@/features/project-management/server/validators/task.validator";
import type { TaskInput, TaskPatch, TaskStatus } from "@/types";

function normalizeTaskStatus(isCompleted: boolean, status: TaskStatus): TaskStatus {
  if (isCompleted) {
    return "done";
  }

  if (status === "done") {
    return "planned";
  }

  return status;
}

function toNullableDate(value: string) {
  return value ? new Date(value) : null;
}

function getDescendantTaskIds(
  tasks: Array<{
    id: string;
    parentTaskId: string | null;
  }>,
  taskId: string,
): string[] {
  const childIds = tasks.filter((task) => task.parentTaskId === taskId).map((task) => task.id);
  return childIds.flatMap((childId) => [childId, ...getDescendantTaskIds(tasks, childId)]);
}

export async function createTask(projectId: string, input: TaskInput, currentUserId?: string | null) {
  const title = validateTaskTitle(input.title);
  const isCompleted = Boolean(input.isCompleted || input.status === "done");
  const actorUserId = await resolveActorUserId(currentUserId);
  const createdTask = await createTaskRecord({
    projectId,
    parentTaskId: input.parentTaskId ?? null,
    title,
    description: input.description.trim(),
    assigneeId: input.assigneeId ?? null,
    priority: input.priority,
    status: normalizeTaskStatus(isCompleted, input.status),
    isCompleted,
    startDate: toNullableDate(input.startDate),
    dueDate: toNullableDate(input.dueDate),
    memo: input.memo.trim(),
    createdById: actorUserId,
    updatedById: actorUserId,
  });

  revalidatePath("/");
  return createdTask;
}

export async function updateTask(taskId: string, patch: TaskPatch, currentUserId?: string | null) {
  const nextStatus = patch.status ?? "planned";
  const isCompleted = patch.isCompleted ?? nextStatus === "done";
  const actorUserId = await resolveActorUserId(currentUserId);

  const updatedTask = await updateTaskRecord(taskId, {
    title: patch.title ? validateTaskTitle(patch.title) : undefined,
    description: patch.description?.trim(),
    assigneeId: patch.assigneeId ?? undefined,
    priority: patch.priority,
    status: patch.status ? normalizeTaskStatus(isCompleted, patch.status) : undefined,
    isCompleted: patch.isCompleted,
    startDate: patch.startDate !== undefined ? toNullableDate(patch.startDate) : undefined,
    dueDate: patch.dueDate !== undefined ? toNullableDate(patch.dueDate) : undefined,
    memo: patch.memo?.trim(),
    updatedById: actorUserId,
  });

  revalidatePath("/");
  return updatedTask;
}

export async function deleteTask(taskId: string) {
  const tasks = await listTasks();
  const taskIds = [taskId, ...getDescendantTaskIds(tasks, taskId)];

  await cleanupTaskDependencies(taskIds);
  await deleteTasksByIds(taskIds);

  revalidatePath("/");
}

export async function addComment(taskId: string, body: string, authorId: string) {
  const trimmedBody = body.trim();
  const resolvedAuthorId = await resolveActorUserId(authorId);

  if (!trimmedBody) {
    throw new Error("댓글 내용을 입력해 주세요.");
  }

  const comment = await createCommentRecord({
    taskId,
    authorId: resolvedAuthorId!,
    body: trimmedBody,
  });

  revalidatePath("/");
  return comment;
}
