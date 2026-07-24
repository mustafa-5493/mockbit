import { NextResponse } from "next/server";
import { getLoggedRequests, clearRequestLogs } from "@/lib/store-engine";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    let logs = getLoggedRequests(limit);

    if (slug) {
      logs = logs.filter(
        (l) => l.path.includes(`/${slug}`) || l.path.includes(`slug=${slug}`)
      );
    }

    return NextResponse.json(
      {
        total: logs.length,
        logs,
      },
      {
        status: 200,
        headers: {
          "cache-control": "no-store, max-age=0",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch request logs" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    clearRequestLogs();
    return NextResponse.json({ message: "Request logs cleared successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to clear request logs" },
      { status: 500 }
    );
  }
}
