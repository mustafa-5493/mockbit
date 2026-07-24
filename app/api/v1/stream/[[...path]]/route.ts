import { NextRequest } from "next/server";
import { faker } from "@faker-js/faker";
import { logRequest } from "@/lib/store-engine";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Connection, X-Mockbit-Branch",
};

export async function GET(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path } = await context.params;
  const subpath = path ? path.join("/") : "general";
  const fullPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;

  logRequest({
    id: `sse_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    method: "GET",
    path: fullPath,
    headers: Object.fromEntries(req.headers.entries()),
    query: Object.fromEntries(req.nextUrl.searchParams.entries()),
    response_status: 200,
    response_body: { message: "SSE Stream Active", subpath },
    timestamp: new Date().toISOString(),
    latency_ms: 1,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let count = 0;

      // Send initial connection event
      const initialPayload = JSON.stringify({
        message: "Connected to Mockbit SSE Real-Time Event Stream",
        subpath,
        timestamp: new Date().toISOString(),
      });
      controller.enqueue(encoder.encode(`event: connected\ndata: ${initialPayload}\n\n`));

      const interval = setInterval(() => {
        count += 1;
        if (count > 60) {
          clearInterval(interval);
          controller.close();
          return;
        }

        const mockEvent = {
          id: `evt_${Date.now()}_${count}`,
          subpath,
          status: faker.helpers.arrayElement(["processing", "completed", "pending", "updated"]),
          value: parseFloat(faker.finance.amount({ min: 10, max: 500, dec: 2 })),
          customer_email: faker.internet.email(),
          timestamp: new Date().toISOString(),
          tick: count,
        };

        const sseFormatted = `id: ${count}\nevent: message\ndata: ${JSON.stringify(mockEvent)}\n\n`;
        controller.enqueue(encoder.encode(sseFormatted));
      }, 1000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      ...CORS_HEADERS,
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
