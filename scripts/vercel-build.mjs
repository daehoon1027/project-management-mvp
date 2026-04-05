import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// Vercel caches node_modules between builds, so regenerate Prisma Client in CI.
if (process.env.VERCEL || process.env.CI) {
  run("npx", ["prisma", "generate"]);
}

if (process.env.DATABASE_URL) {
  run("npx", ["prisma", "migrate", "deploy"]);
} else {
  console.warn("DATABASE_URL is not set. Skipping prisma migrate deploy.");
}

run("next", ["build"]);
