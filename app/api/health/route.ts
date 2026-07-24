import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * Health check endpoint used to keep Supabase Postgres instance warm
 * and prevent 7-day inactivity auto-pause on Supabase free tier.
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Perform light query against projects or endpoints table
    const { count, error } = await supabaseAdmin
      .from("endpoints")
      .select("*", { count: "exact", head: true });

    const latency = Date.now() - startTime;

    if (error) {
      return NextResponse.json(
        {
          status: "degraded",
          database: "error",
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      endpoints_count: count ?? 0,
      db_latency_ms: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: err?.message || "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
