import { prisma } from "@/server/db/prisma";

export function listNotifications() {
  return prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
  });
}

