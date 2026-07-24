import { NextRequest, NextResponse } from "next/server";
import { logRequest } from "@/lib/store-engine";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

async function handleEcho(req: NextRequest, params?: { path?: string[] }) {
  const startTime = Date.now();
  const subpath = params?.path ? `/${params.path.join("/")}` : "";
  const fullPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;

  const query: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((val, key) => {
    query[key] = val;
  });

  const headers: Record<string, string> = {};
  req.headers.forEach((val, key) => {
    headers[key] = val;
  });

  let body: any = null;
  const contentType = req.headers.get("content-type") || "";

  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
    try {
      if (contentType.includes("application/json")) {
        body = await req.json();
      } else {
        body = await req.text();
      }
    } catch {
      body = null;
    }
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const timestamp = new Date().toISOString();
  const latencyMs = Date.now() - startTime;

  const echoResponse = {
    message: "HTTP Echo Request Received",
    method: req.method,
    url: fullPath,
    subpath: subpath || "/",
    headers,
    query,
    body,
    ip,
    timestamp,
    latency_ms: latencyMs,
  };

  logRequest({
    id: `echo_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    method: req.method,
    path: fullPath,
    headers,
    query,
    body,
    response_status: 200,
    response_body: echoResponse,
    timestamp,
    latency_ms: latencyMs,
    ip,
  });

  return NextResponse.json(echoResponse, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

export async function GET(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  return handleEcho(req, params);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  return handleEcho(req, params);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  return handleEcho(req, params);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  return handleEcho(req, params);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  return handleEcho(req, params);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
