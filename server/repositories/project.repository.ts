import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

export const projectListInclude = {
  approvals: {
    orderBy: {
      order: "asc",
    },
  },
} satisfies Prisma.ProjectInclude;

export type ProjectRecord = Prisma.ProjectGetPayload<{
  include: typeof projectListInclude;
}>;

export function listProjects() {
  return prisma.project.findMany({
    include: projectListInclude,
    orderBy: [
      { depth: "asc" },
      { createdAt: "asc" },
    ],
  });
}

export function getProjectById(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: projectListInclude,
  });
}

export function createProjectRecord(data: Prisma.ProjectUncheckedCreateInput) {
  return prisma.project.create({
    data,
    include: projectListInclude,
  });
}

export function updateProjectRecord(projectId: string, data: Prisma.ProjectUncheckedUpdateInput) {
  return prisma.project.update({
    where: { id: projectId },
    data,
    include: projectListInclude,
  });
}

export function deleteProjectsByIds(projectIds: string[]) {
  return prisma.project.deleteMany({
    where: {
      id: {
        in: projectIds,
      },
    },
  });
}
