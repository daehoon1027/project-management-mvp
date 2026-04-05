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

