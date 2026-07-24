import { NextRequest, NextResponse } from "next/server";
import { handleMockRequest, CORS_HEADERS } from "@/lib/mock-handler";

export const runtime = "nodejs";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(req: NextRequest, context: any) {
  return handleMockRequest(req, context);
}

export async function POST(req: NextRequest, context: any) {
  return handleMockRequest(req, context);
}

export async function PUT(req: NextRequest, context: any) {
  return handleMockRequest(req, context);
}

export async function PATCH(req: NextRequest, context: any) {
  return handleMockRequest(req, context);
}

export async function DELETE(req: NextRequest, context: any) {
  return handleMockRequest(req, context);
}
