const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@company.local" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@company.local",
      role: "admin",
      title: "System Admin",
      department: {
        connectOrCreate: {
          where: { code: "PMO" },
          create: {
            name: "PMO",
            code: "PMO",
            description: "Project management office",
          },
        },
      },
    },
  });

  const rootProject = await prisma.project.upsert({
    where: { id: "seed-root-project" },
    update: {},
    create: {
      id: "seed-root-project",
      name: "2026 Operating Plan",
      description: "Seeded root project for Prisma/PostgreSQL setup",
      depth: 1,
      color: "blue",
      status: "active",
      isFavorite: true,
      ownerId: admin.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.task.upsert({
    where: { id: "seed-root-task" },
    update: {},
    create: {
      id: "seed-root-task",
      projectId: rootProject.id,
      title: "Connect Prisma to the app",
      description: "Initial seed task created to verify Prisma/PostgreSQL wiring",
      assigneeId: admin.id,
      priority: "high",
      status: "in_progress",
      isCompleted: false,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
