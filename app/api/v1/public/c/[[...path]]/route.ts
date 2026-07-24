import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// In-memory custom endpoint storage
const CUSTOM_ENDPOINTS = new Map<string, any>();

// Pre-seed sample custom endpoints
CUSTOM_ENDPOINTS.set("demo", { message: "Welcome to Mockbit Instant Custom API", status: "active", version: "v1.0" });
CUSTOM_ENDPOINTS.set("f8K2Lp", { user: "Jane Doe", role: "Developer", permissions: ["admin", "read", "write"] });

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await context.params;
  const id = path[0];

  if (!id) {
    return NextResponse.json(
      {
        message: "Mockbit Instant Custom API Generator",
        usage: "POST /api/v1/public/c with JSON body to generate instant shareable mock URL",
        active_endpoints: CUSTOM_ENDPOINTS.size,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  }

  const data = CUSTOM_ENDPOINTS.get(id);
  if (!data) {
    return NextResponse.json(
      { error: `Custom endpoint '${id}' not found. Create one with POST /api/v1/public/c` },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(data, { status: 200, headers: CORS_HEADERS });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await context.params;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body provided" }, { status: 400, headers: CORS_HEADERS });
  }

  // If subpath ID provided, update custom store
  const id = path[0] || Math.random().toString(36).substring(2, 8);
  CUSTOM_ENDPOINTS.set(id, body);

  return NextResponse.json(
    {
      id,
      url: `https://mockbit.io/api/v1/public/c/${id}`,
      path: `/api/v1/public/c/${id}`,
      local_url: `http://localhost:3000/api/v1/public/c/${id}`,
      data: body,
      upgrade_hint: "Want persistence, foreign key relations, or time-travel? Open Endpoint Studio.",
    },
    { status: 201, headers: CORS_HEADERS }
  );
}
