export function isDatabaseConfigured() {
  const databaseUrl = process.env.DATABASE_URL;

  return (
    typeof databaseUrl === "string" &&
    (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://"))
  );
}
