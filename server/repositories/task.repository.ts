import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

export const taskListInclude = {
  assignee: true,
  checklistItems: {
    orderBy: {
      createdAt: "asc",
    },
  },
  approvals: {
    orderBy: {
      order: "asc",
    },
  },
} satisfies Prisma.TaskInclude;

export type TaskRecord = Prisma.TaskGetPayload<{
  include: typeof taskListInclude;
}>;

export function listTasks() {
  return prisma.task.findMany({
    include: taskListInclude,
    orderBy: [
      { createdAt: "asc" },
      { title: "asc" },
    ],
  });
}

export function getTaskById(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: taskListInclude,
  });
}

export function createTaskRecord(data: Prisma.TaskUncheckedCreateInput) {
  return prisma.task.create({
    data,
    include: taskListInclude,
  });
}

export function updateTaskRecord(taskId: string, data: Prisma.TaskUncheckedUpdateInput) {
  return prisma.task.update({
    where: { id: taskId },
    data,
    include: taskListInclude,
  });
}

export function deleteTasksByIds(taskIds: string[]) {
  return prisma.task.deleteMany({
    where: {
      id: {
        in: taskIds,
      },
    },
  });
}
