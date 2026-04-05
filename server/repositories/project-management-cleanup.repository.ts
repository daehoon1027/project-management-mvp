import { prisma } from "@/server/db/prisma";

export function cleanupProjectDependencies(projectIds: string[], taskIds: string[]) {
  return prisma.$transaction([
    prisma.comment.deleteMany({
      where: {
        taskId: {
          in: taskIds,
        },
      },
    }),
    prisma.checklistItem.deleteMany({
      where: {
        taskId: {
          in: taskIds,
        },
      },
    }),
    prisma.approvalStep.deleteMany({
      where: {
        OR: [
          {
            projectId: {
              in: projectIds,
            },
          },
          {
            taskId: {
              in: taskIds,
            },
          },
        ],
      },
    }),
    prisma.attachment.deleteMany({
      where: {
        OR: [
          {
            projectId: {
              in: projectIds,
            },
          },
          {
            taskId: {
              in: taskIds,
            },
          },
        ],
      },
    }),
    prisma.activityLog.deleteMany({
      where: {
        OR: [
          {
            projectId: {
              in: projectIds,
            },
          },
          {
            taskId: {
              in: taskIds,
            },
          },
          {
            entityType: "project",
            entityId: {
              in: projectIds,
            },
          },
          {
            entityType: "task",
            entityId: {
              in: taskIds,
            },
          },
        ],
      },
    }),
  ]);
}

export function cleanupTaskDependencies(taskIds: string[]) {
  return prisma.$transaction([
    prisma.comment.deleteMany({
      where: {
        taskId: {
          in: taskIds,
        },
      },
    }),
    prisma.checklistItem.deleteMany({
      where: {
        taskId: {
          in: taskIds,
        },
      },
    }),
    prisma.approvalStep.deleteMany({
      where: {
        taskId: {
          in: taskIds,
        },
      },
    }),
    prisma.attachment.deleteMany({
      where: {
        taskId: {
          in: taskIds,
        },
      },
    }),
    prisma.activityLog.deleteMany({
      where: {
        OR: [
          {
            taskId: {
              in: taskIds,
            },
          },
          {
            entityType: "task",
            entityId: {
              in: taskIds,
            },
          },
        ],
      },
    }),
  ]);
}

export function createCommentRecord(data: {
  taskId: string;
  authorId: string;
  body: string;
}) {
  return prisma.comment.create({
    data,
  });
}
