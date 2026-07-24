import { NextRequest, NextResponse } from "next/server";
import { faker } from "@faker-js/faker";
import { logRequest } from "@/lib/store-engine";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Mockbit-Branch, X-GraphQL-Operation-Name",
};

/**
 * Simple GraphQL query field parser
 */
function parseGraphQLQuery(queryString: string): { operationName: string; fields: string[] } {
  let operationName = "data";
  const fields: string[] = ["id", "name"];

  if (!queryString || typeof queryString !== "string") {
    return { operationName: "records", fields };
  }

  // Match operation name e.g. query { users { id name } } or query GetUsers { users { id name } }
  const opMatch = queryString.match(/(?:query|mutation)?\s*([a-zA-Z0-9_]*)\s*\{?\s*([a-zA-Z0-9_]+)\s*\{([^}]+)\}/i);
  if (opMatch) {
    if (opMatch[2]) operationName = opMatch[2];
    if (opMatch[3]) {
      const parsedFields = opMatch[3]
        .split(/\s+/)
        .map((f) => f.trim().replace(/[^a-zA-Z0-9_]/g, ""))
        .filter(Boolean);
      if (parsedFields.length > 0) {
        return { operationName, fields: parsedFields };
      }
    }
  }

  // Fallback simple keyword extraction
  const simpleMatch = queryString.match(/([a-zA-Z0-9_]+)\s*\{/);
  if (simpleMatch && simpleMatch[1]) {
    operationName = simpleMatch[1];
  }

  return { operationName: operationName || "query", fields };
}

function generateGraphQLMockRecord(fields: string[]): Record<string, any> {
  const record: Record<string, any> = {};
  fields.forEach((f) => {
    const lower = f.toLowerCase();
    if (lower === "id" || lower.endsWith("_id")) {
      record[f] = `usr_${faker.string.alphanumeric(6)}`;
    } else if (lower.includes("name") || lower.includes("title")) {
      record[f] = faker.person.fullName();
    } else if (lower.includes("email")) {
      record[f] = faker.internet.email();
    } else if (lower.includes("price") || lower.includes("amount") || lower.includes("total")) {
      record[f] = parseFloat(faker.finance.amount({ min: 10, max: 999, dec: 2 }));
    } else if (lower.includes("status") || lower.includes("state")) {
      record[f] = faker.helpers.arrayElement(["active", "pending", "completed"]);
    } else if (lower.includes("date") || lower.includes("time") || lower.includes("created")) {
      record[f] = faker.date.recent().toISOString();
    } else if (lower.includes("is_") || lower.includes("has_") || lower.startsWith("is") || lower.startsWith("has")) {
      record[f] = faker.datatype.boolean();
    } else {
      record[f] = faker.lorem.word();
    }
  });
  return record;
}

async function handleGraphQLRequest(req: NextRequest) {
  const startTime = Date.now();
  let queryString = "";
  let variables: Record<string, any> = {};

  if (req.method === "POST") {
    try {
      const body = await req.json();
      queryString = body.query || "";
      variables = body.variables || {};
    } catch {
      queryString = "";
    }
  } else {
    queryString = req.nextUrl.searchParams.get("query") || "";
  }

  const { operationName, fields } = parseGraphQLQuery(queryString);

  const mockRecords = Array.from({ length: 3 }, () => generateGraphQLMockRecord(fields));

  const graphqlResult = {
    data: {
      [operationName]: mockRecords,
    },
  };

  const latencyMs = Date.now() - startTime;
  const fullPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;

  logRequest({
    id: `gql_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    method: req.method,
    path: fullPath,
    headers: Object.fromEntries(req.headers.entries()),
    query: Object.fromEntries(req.nextUrl.searchParams.entries()),
    body: { query: queryString, variables },
    response_status: 200,
    response_body: graphqlResult,
    timestamp: new Date().toISOString(),
    latency_ms: latencyMs,
  });

  return NextResponse.json(graphqlResult, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

export async function GET(req: NextRequest) {
  return handleGraphQLRequest(req);
}

export async function POST(req: NextRequest) {
  return handleGraphQLRequest(req);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
