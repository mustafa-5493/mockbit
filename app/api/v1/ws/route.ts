import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    start(controller) {
      let tickCount = 0;

      // Send initial socket connection message
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            event: "connection.established",
            socketId: "ws_mb_" + Math.random().toString(36).substring(2, 9),
            protocol: "websocket-sim/1.0",
            timestamp: Date.now(),
          })}\n\n`
        )
      );

      const interval = setInterval(() => {
        tickCount++;
        const message = {
          event: "socket.ticker.update",
          tick: tickCount,
          symbol: "BTC-USD",
          price: Number((94500 + Math.sin(tickCount) * 350 + Math.random() * 50).toFixed(2)),
          volume_24h: Number((1250.45 + tickCount * 2.5).toFixed(2)),
          timestamp: Date.now(),
        };

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));

        if (tickCount >= 100) {
          clearInterval(interval);
          controller.close();
        }
      }, 1000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
      });
    },
  });

  return new NextResponse(customReadable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Mockbit-WebSocket-Sim": "active",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json({
      event: "socket.message.echo",
      received: body,
      echoTimestamp: Date.now(),
      status: "delivered",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Invalid JSON frame", message: error.message },
      { status: 400 }
    );
  }
}
