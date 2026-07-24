import { NextResponse } from "next/server";
import { recordProxyRequest } from "@/lib/proxy-recorder";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { targetUrl, method = "GET", headers, payload } = body;

    if (!targetUrl || typeof targetUrl !== "string") {
      return NextResponse.json({ error: "Missing required string property 'targetUrl'" }, { status: 400 });
    }

    const recorded = await recordProxyRequest(targetUrl, method, headers, payload);

    return NextResponse.json(recorded, {
      status: 200,
      headers: {
        "x-mockbit-proxy-recorded": "true",
        "x-mockbit-inferred-fields": String(recorded.inferredFields.length),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to proxy HTTP request" },
      { status: 500 }
    );
  }
}
