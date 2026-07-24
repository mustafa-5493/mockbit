import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const {
      targetUrl,
      event = "mockbit.event.triggered",
      secret = "whsec_mockbit_demo_secret",
      payload = { id: "evt_12345", type: event, timestamp: Date.now(), data: { message: "Synthetic webhook event dispatched from Mockbit Substrate" } },
    } = body;

    if (!targetUrl || typeof targetUrl !== "string") {
      return NextResponse.json(
        { error: "Missing required string parameter: targetUrl" },
        { status: 400 }
      );
    }

    const payloadString = typeof payload === "string" ? payload : JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);

    // Compute HMAC SHA256 Signatures
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${timestamp}.${payloadString}`);
    const signatureHex = hmac.digest("hex");

    const hmacSignatureHeader = `t=${timestamp},v1=${signatureHex}`;

    // Dispatch HTTP POST Webhook Payload to Target URL
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mockbit-Webhook-Engine/1.0",
        "X-Mockbit-Event": event,
        "X-Mockbit-Signature": hmacSignatureHeader,
        "X-Stripe-Signature": hmacSignatureHeader,
      },
      body: payloadString,
    });

    const durationMs = Date.now() - startTime;
    const responseText = await response.text();

    return NextResponse.json({
      success: true,
      targetUrl,
      event,
      statusCode: response.status,
      statusText: response.statusText,
      durationMs,
      timestamp,
      signature: hmacSignatureHeader,
      responseBody: responseText,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to deliver webhook payload",
        durationMs,
      },
      { status: 502 }
    );
  }
}
