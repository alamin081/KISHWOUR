import { connection, NextResponse } from "next/server";

import { getDatabaseDriver, isDatabaseConfigured, pingDatabase } from "@/lib/db";

const noStore = { "Cache-Control": "no-store" };

/**
 * Liveness + database connectivity check for uptime monitors and deployments.
 * Never returns configuration values, hostnames or error details.
 */
export async function GET() {
  await connection();
  const timestamp = new Date().toISOString();

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { status: "degraded", database: "not_configured", timestamp },
      { status: 503, headers: noStore },
    );
  }

  try {
    await pingDatabase();
    return NextResponse.json(
      { status: "ok", database: "ok", driver: getDatabaseDriver(), timestamp },
      { headers: noStore },
    );
  } catch (error) {
    console.error("[health] database check failed", error);
    return NextResponse.json(
      { status: "degraded", database: "unreachable", timestamp },
      { status: 503, headers: noStore },
    );
  }
}
