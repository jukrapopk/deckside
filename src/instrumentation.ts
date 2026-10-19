export async function register() {
  // `register` also runs for the edge runtime and during `next build`.
  // Migrations should only run once, in a real Node.js server process.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { runMigrations } = await import("./db/migrate");
  runMigrations();
}
