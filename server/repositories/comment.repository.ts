import { prisma } from "@/server/db/prisma";

export function listComments() {
  return prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
  });
}

