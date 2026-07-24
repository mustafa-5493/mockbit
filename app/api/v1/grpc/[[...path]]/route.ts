import { NextRequest, NextResponse } from "next/server";
import { generateMockResponse } from "@/lib/mock-generator";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await context.params;
  const pathParts = resolvedParams.path || ["Greeter", "SayHello"];
  const service = pathParts[0] || "DefaultService";
  const method = pathParts[1] || "DefaultMethod";

  let clientPayload = {};
  try {
    clientPayload = await req.json();
  } catch (e) {
    // empty JSON payload
  }

  const defaultGrpcFields = [
    { name: "id", type: "uuid" as const },
    { name: "service_name", type: "lorem" as const },
    { name: "status_code", type: "number" as const },
    { name: "is_success", type: "boolean" as const },
    { name: "created_at", type: "date" as const },
  ];

  const mockData = generateMockResponse(defaultGrpcFields, "array", 3);

  return NextResponse.json(
    {
      grpc_service: service,
      grpc_method: method,
      grpc_code: 0, // 0 = OK in gRPC status codes
      grpc_status: "OK",
      timestamp: Date.now(),
      request_payload: clientPayload,
      result: mockData,
    },
    {
      headers: {
        "content-type": "application/grpc-web+json",
        "grpc-status": "0",
        "grpc-message": "OK",
        "x-mockbit-grpc-server": "active",
      },
    }
  );
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return POST(req, context);
}
