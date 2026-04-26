import { getDb } from "@/lib/db";

// Lightweight health endpoint for uptime monitors / docker healthcheck.
// Verifies the SQLite connection is responsive without leaking internals.
export async function GET() {
  const start = Date.now();
  try {
    const db = getDb();
    const row = db.prepare("SELECT 1 AS ok").get() as { ok: number } | undefined;
    if (!row || row.ok !== 1) throw new Error("db check failed");

    return Response.json(
      {
        status: "ok",
        uptimeSeconds: Math.round(process.uptime()),
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (err) {
    console.error("[health] check failed:", err);
    return Response.json(
      { status: "error", timestamp: new Date().toISOString() },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }
}
