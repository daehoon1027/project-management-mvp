import { prisma } from "@/server/db/prisma";

export function listActivityLogs() {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

