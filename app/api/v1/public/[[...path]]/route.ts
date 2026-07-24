import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_DATASETS, getPublicDatasetBySlug } from "@/lib/datasets";
import { getResilienceBundleById, RESILIENCE_BUNDLES } from "@/lib/datasets/resilience";
import { getArenaWorldById, ARENA_WORLDS } from "@/lib/datasets/arena";
import { runEventCascade } from "@/lib/event-engine";
import {
  getStoreKey,
  getOrSeedStore,
  setStoreData,
  recordTransaction,
  executeCascadeDelete,
  resolveNestedSubpathRecords,
  applyQueryParameters,
  rewindToVersion,
  logRequest,
} from "@/lib/store-engine";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Mockbit-Branch, X-Mockbit-Scenario, X-Branch, X-Scenario",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return handlePublicRequest(req, context, "GET");
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return handlePublicRequest(req, context, "POST");
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return handlePublicRequest(req, context, "PUT");
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return handlePublicRequest(req, context, "PATCH");
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return handlePublicRequest(req, context, "DELETE");
}

async function handlePublicRequest(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
  method: string
): Promise<NextResponse> {
  const { path = [] } = await context.params;

  // Handle /arena/[id] routes (Mockbit Arena™ AI Agent Substrate & Deterministic Event Engine)
  if (path[0] === "arena") {
    const worldId = path[1];
    if (!worldId) {
      return NextResponse.json({ message: "Mockbit Arena™ — Synthetic Internet Worlds for AI Agents", worlds: ARENA_WORLDS }, { status: 200, headers: CORS_HEADERS });
    }
    const world = getArenaWorldById(worldId);
    if (!world) {
      return NextResponse.json({ error: `Arena world '${worldId}' not found. Available: fintech-billing, devops-incident, commerce-retail, healthcare-fhir` }, { status: 404, headers: CORS_HEADERS });
    }

    // Handle POST /arena/[worldId]/events
    if (path[2] === "events" && method === "POST") {
      let body: any = {};
      try {
        body = await req.json();
      } catch {}
      const eventName = body.event || "stripe.refund.created";
      const eventPayload = body.payload || { amount: 49.0, customer_id: "cus_99" };
      const branch = req.headers.get("x-mockbit-branch") || "main";

      const cascadeResult = runEventCascade(eventName, eventPayload, world.event_rules || [], world.invariants || [], world.workflows || [], undefined, world.id, branch);
      return NextResponse.json(cascadeResult, { status: 200, headers: CORS_HEADERS });
    }

    return NextResponse.json(world, { status: 200, headers: CORS_HEADERS });
  }

  // Handle /resilience/[id] routes
  if (path[0] === "resilience") {
    const bundleId = path[1];
    if (!bundleId) {
      return NextResponse.json({ message: "Mockbit Resilience Harness Registry", bundles: RESILIENCE_BUNDLES }, { status: 200, headers: CORS_HEADERS });
    }
    const bundle = getResilienceBundleById(bundleId);
    if (!bundle) {
      return NextResponse.json({ error: `Resilience bundle '${bundleId}' not found. Available: security, unicode, boundary` }, { status: 404, headers: CORS_HEADERS });
    }
    return NextResponse.json(bundle, { status: 200, headers: CORS_HEADERS });
  }

  if (path.length === 0) {
    // List available public dataset endpoints
    const catalog = PUBLIC_DATASETS.map((d) => ({
      slug: d.slug,
      name: d.name,
      category: d.category,
      url: `/api/v1/public/${d.slug}`,
      itemCount: d.records.length,
    }));
    return NextResponse.json({ message: "Mockbit Public Datasets Registry", endpoints: catalog }, { status: 200, headers: CORS_HEADERS });
  }

  const endpointSlug = path[0];
  const dataset = getPublicDatasetBySlug(endpointSlug);

  if (!dataset) {
    return NextResponse.json(
      { error: `Public dataset resource '${endpointSlug}' not found. Available: ${PUBLIC_DATASETS.map((d) => d.slug).join(", ")}` },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const branch = req.headers.get("x-mockbit-branch") || req.headers.get("x-branch") || "main";
  const user = "public";
  const storeKey = getStoreKey(user, endpointSlug, branch);

  // Initialize dataset store with default seed records if empty
  if (!getOrSeedStore(storeKey, {}, "array", dataset.records.length)) {
    setStoreData(storeKey, dataset.records);
  }

  const store = getOrSeedStore(storeKey, {}, "array", dataset.records.length);

  // Handle Nested Subpaths e.g., GET /api/v1/public/users/usr_101/orders
  if (path.length >= 3) {
    const parentId = path[1];
    const childEndpointSlug = path[2];
    const childResourceId = path[3] || null;

    const childDataset = getPublicDatasetBySlug(childEndpointSlug);
    const childStoreKey = getStoreKey(user, childEndpointSlug, branch);
    const childStore = getOrSeedStore(childStoreKey, {}, "array", childDataset?.records.length || 5);

    const filtered = resolveNestedSubpathRecords(store, parentId, childStore, childEndpointSlug, dataset.relations);

    if (childResourceId) {
      const item = filtered.find((r) => String(r["id"]) === childResourceId);
      if (!item) {
        return NextResponse.json({ error: "Resource not found under parent", parentId, childResourceId }, { status: 404, headers: CORS_HEADERS });
      }
      return NextResponse.json(item, { status: 200, headers: CORS_HEADERS });
    }

    return NextResponse.json(filtered, { status: 200, headers: CORS_HEADERS });
  }

  const resourceId = path.length > 1 ? path[1] : null;

  switch (method) {
    case "GET": {
      const url = new URL(req.url);
      const searchParams = url.searchParams;

      // Handle subpath navigation (/users/1 or /users/1/orders or /users/1/orders/102)
      const targetRecords = path.length > 1 ? resolveNestedSubpathRecords(store, path.slice(1)) : store;

      if (path.length === 2 && targetRecords.length === 1 && !searchParams.toString()) {
        return NextResponse.json(targetRecords[0], { status: 200, headers: CORS_HEADERS });
      }

      // Apply pagination, sorting, and filtering
      const queryResult = applyQueryParameters(targetRecords, searchParams);

      const headers = {
        ...CORS_HEADERS,
        "X-Total-Count": String(queryResult.total),
        "X-Page": String(queryResult.page),
        "X-Per-Page": String(queryResult.limit),
      };

      logRequest({
        id: `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        method: req.method,
        path: req.nextUrl.pathname + req.nextUrl.search,
        headers: Object.fromEntries(req.headers.entries()),
        query: Object.fromEntries(searchParams.entries()),
        response_status: 200,
        response_body: queryResult.data,
        timestamp: new Date().toISOString(),
        latency_ms: Math.floor(Math.random() * 15) + 2,
      });

      return NextResponse.json(queryResult.data, { status: 200, headers });
    }

    case "POST": {
      let body: Record<string, unknown> = {};
      try {
        body = await req.json();
      } catch {
        body = {};
      }
      if (!body["id"]) {
        body["id"] = `${endpointSlug.slice(0, 4)}_${Date.now()}`;
      }
      if (!body["created_at"]) {
        body["created_at"] = new Date().toISOString();
      }
      store.push(body);
      setStoreData(storeKey, store);

      recordTransaction(user, branch, endpointSlug, "POST", `+ ${endpointSlug} (${String(body["id"])})`, store, String(body["id"]));
      return NextResponse.json(body, { status: 201, headers: CORS_HEADERS });
    }

    case "PUT": {
      if (!resourceId) {
        return NextResponse.json({ error: "PUT requires a resource ID" }, { status: 400, headers: CORS_HEADERS });
      }
      let body: Record<string, unknown> = {};
      try {
        body = await req.json();
      } catch {
        body = {};
      }
      const idx = store.findIndex((r) => String(r["id"]) === resourceId);
      if (idx === -1) {
        return NextResponse.json({ error: "Resource not found", id: resourceId }, { status: 404, headers: CORS_HEADERS });
      }
      const updated = { ...body, id: resourceId };
      store[idx] = updated;
      setStoreData(storeKey, store);

      recordTransaction(user, branch, endpointSlug, "PUT", `= ${endpointSlug} (${resourceId})`, store, resourceId);
      return NextResponse.json(updated, { status: 200, headers: CORS_HEADERS });
    }

    case "PATCH": {
      if (!resourceId) {
        return NextResponse.json({ error: "PATCH requires a resource ID" }, { status: 400, headers: CORS_HEADERS });
      }
      let body: Record<string, unknown> = {};
      try {
        body = await req.json();
      } catch {
        body = {};
      }
      const idx = store.findIndex((r) => String(r["id"]) === resourceId);
      if (idx === -1) {
        return NextResponse.json({ error: "Resource not found", id: resourceId }, { status: 404, headers: CORS_HEADERS });
      }
      const patched = { ...store[idx], ...body, id: resourceId };
      store[idx] = patched;
      setStoreData(storeKey, store);

      recordTransaction(user, branch, endpointSlug, "PATCH", `~ updated ${endpointSlug} (${resourceId})`, store, resourceId);
      return NextResponse.json(patched, { status: 200, headers: CORS_HEADERS });
    }

    case "DELETE": {
      if (!resourceId) {
        setStoreData(storeKey, []);
        recordTransaction(user, branch, endpointSlug, "DELETE", "- purged all records", []);
        return NextResponse.json({ message: "All resources deleted", store: storeKey }, { status: 200, headers: CORS_HEADERS });
      }
      const idx = store.findIndex((r) => String(r["id"]) === resourceId);
      if (idx === -1) {
        return NextResponse.json({ error: "Resource not found", id: resourceId }, { status: 404, headers: CORS_HEADERS });
      }
      const removed = store.splice(idx, 1)[0];
      setStoreData(storeKey, store);

      const cascadeRes = executeCascadeDelete(user, branch, endpointSlug, String(removed["id"] || resourceId), dataset.relations || []);
      recordTransaction(user, branch, endpointSlug, "DELETE", `- ${endpointSlug} (${resourceId})`, store, resourceId);

      return NextResponse.json({ message: "Resource deleted", deleted: removed, cascadeDeleted: cascadeRes.cascadeCount }, { status: 200, headers: CORS_HEADERS });
    }

    default:
      return NextResponse.json({ error: `Method ${method} not supported` }, { status: 405, headers: CORS_HEADERS });
  }
}
