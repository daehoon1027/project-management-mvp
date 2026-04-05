import type { User } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

export function listUsers() {
  return prisma.user.findMany({
    orderBy: [
      { role: "asc" },
      { name: "asc" },
    ],
  });
}

export function listDepartments() {
  return prisma.department.findMany({
    orderBy: { name: "asc" },
  });
}

export function getFirstUser() {
  return prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });
}

export function ensureSystemUser() {
  return prisma.user.upsert({
    where: { email: "system@project-management.local" },
    update: {},
    create: {
      name: "System Admin",
      email: "system@project-management.local",
      role: "admin",
      title: "System",
      isActive: true,
    },
  });
}

export async function resolveActorUserId(preferredUserId?: string | null): Promise<string | null> {
  if (preferredUserId) {
    const user = await prisma.user.findUnique({
      where: { id: preferredUserId },
      select: { id: true },
    });

    if (user) {
      return user.id;
    }
  }

  const firstUser = await getFirstUser();
  if (firstUser) {
    return firstUser.id;
  }

  const systemUser: User = await ensureSystemUser();
  return systemUser.id;
}
