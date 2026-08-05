import { NextRequest, NextResponse, after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  generateMockResponse,
  FieldDefinition,
  RequestContext,
  ConditionalRule,
  EntityRelation,
  ScenarioPreset,
  evaluateConditionalRule,
  evaluateTemplateString,
  parseColonPathTemplate,
  parseFormUrlEncodedBody,
  parseXmlToJson,
} from "@/lib/mock-generator";
import {
  getStoreKey,
  getOrSeedStore,
  setStoreData,
  recordTransaction,
  executeCascadeDelete,
  resolveNestedSubpathRecords,
  applyQueryParameters,
  applyScenarioPreset,
  rewindToVersion,
} from "@/lib/store-engine";
import { dispatchWebhook } from "@/lib/webhook-engine";
import { isSafeExternalUrl } from "@/lib/url-safety";

export const runtime = "nodejs";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Mockbit-Branch, X-Mockbit-Scenario, X-Branch, X-Scenario",
};

export interface WeightedResponseVariant {
  id?: string;
  weight: number; // percentage probability (0-100)
  status: number;
  body?: any;
}

export function getRuleIdHeader(ruleId?: string): Record<string, string> {
  const activeRuleId = ruleId || `rule_${Math.random().toString(36).substring(2, 9)}`;
  return {
    ...CORS_HEADERS,
    "X-Mockbit-Rule-Id": activeRuleId,
    "X-Beeceptor-Rule-Id": activeRuleId,
  };
}

export function selectWeightedResponse(variants: WeightedResponseVariant[]): WeightedResponseVariant | null {
  if (!variants || variants.length === 0) return null;
  const roll = Math.random() * 100;
  let accumulated = 0;
  for (const variant of variants) {
    accumulated += variant.weight;
    if (roll <= accumulated) {
      return variant;
    }
  }
  return variants[0];
}

// ---------------------------------------------------------------------------
// Main Handler
// ---------------------------------------------------------------------------
export async function handleMockRequest(
  req: NextRequest,
  context: { params: Promise<{ user: string; endpointId: string; path?: string[] }> }
) {
  const { user, endpointId, path } = await context.params;
  const method = req.method.toUpperCase();
  const startTime = Date.now();

  // Extract Branch & Scenario Headers / Query Params
  const branch =
    req.headers.get("x-mockbit-branch") ||
    req.headers.get("x-branch") ||
    req.nextUrl.searchParams.get("branch") ||
    "main";

  const activeScenarioName =
    req.headers.get("x-mockbit-scenario") ||
    req.headers.get("x-scenario") ||
    req.nextUrl.searchParams.get("scenario") ||
    undefined;

  // Extract Request Context for Templating & Rule Evaluation
  const queryParams: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((val, key) => {
    queryParams[key] = val;
  });

  const requestHeaders: Record<string, string> = {};
  req.headers.forEach((val, key) => {
    requestHeaders[key] = val.toLowerCase();
  });

  let requestBody: Record<string, any> = {};
  if (["POST", "PUT", "PATCH"].includes(method)) {
    try {
      const clonedReq = req.clone();
      const rawText = await clonedReq.text();
      const contentType = (requestHeaders["content-type"] || "").toLowerCase();

      if (contentType.includes("application/x-www-form-urlencoded")) {
        requestBody = parseFormUrlEncodedBody(rawText);
      } else if (contentType.includes("xml") || contentType.includes("soap")) {
        requestBody = parseXmlToJson(rawText);
      } else {
        try {
          requestBody = JSON.parse(rawText);
        } catch {
          requestBody = { _raw: rawText };
        }
      }
    } catch {
      requestBody = {};
    }
  }

  const requestContext: RequestContext = {
    params: {
      id: path && path.length > 0 ? path[0] : "",
      slug: endpointId,
      user: user,
    },
    query: queryParams,
    headers: requestHeaders,
  };

  // Default fields for unseeded / fallback endpoints
  const defaultFields: FieldDefinition[] = [
    { name: "id", type: "uuid" },
    { name: "name", type: "fullName" },
    { name: "email", type: "email" },
    { name: "status", type: "enum", options: ["active", "pending", "completed"] },
    { name: "created_at", type: "date" },
  ];

  // System Endpoint: Rewind endpoint store state
  if (path && path[0] === "_rewind") {
    const targetVersion = Number(queryParams["version"] || 1);
    const restoredState = rewindToVersion(user, endpointId, branch, targetVersion);
    return NextResponse.json(
      { success: !!restoredState, version: targetVersion, state: restoredState },
      { status: restoredState ? 200 : 400, headers: CORS_HEADERS }
    );
  }

  // ------------------------------------------------------------------
  // Demo / Unauthenticated Fast Path
  // ------------------------------------------------------------------
  if (
    user === "demo" ||
    user.startsWith("demo") ||
    user.startsWith("test") ||
    user.includes("guest")
  ) {
    const storeKey = getStoreKey(user, endpointId, branch);
    let demoSchema: unknown = { fields: defaultFields };

    if (endpointId === "orders") {
      demoSchema = {
        id: "{{params.id}}",
        customer_name: "Sarah Connor",
        customer_email: "sarah@cyberdyne.com",
        total_amount: 149.99,
        status: "shipped",
        created_at: new Date().toISOString(),
        is_paid: true,
      };
    }

    return handleStatefulRequest({
      user,
      branch,
      endpointId,
      method,
      storeKey,
      path,
      schema: demoSchema,
      responseType: "array",
      arrayLength: 5,
      baseStatusCode: 200,
      req,
      requestContext,
      activeScenarioName,
    });
  }

  // ------------------------------------------------------------------
  // Authenticated + DB-Seeded Endpoint Path
  // ------------------------------------------------------------------
  try {
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(endpointId);

    let query = supabaseAdmin.from("endpoints").select("*");
    if (isUuid) {
      query = query.eq("id", endpointId);
    } else {
      query = query.eq("slug", endpointId).eq("user_id", user);
    }

    const { data: endpoint, error } = await query.maybeSingle();

    if (error || !endpoint) {
      const storeKey = getStoreKey(user, endpointId, branch);
      return handleStatefulRequest({
        user,
        branch,
        endpointId,
        method,
        storeKey,
        path,
        schema: { fields: defaultFields },
        responseType: "array",
        arrayLength: 5,
        baseStatusCode: 200,
        req,
        requestContext,
        activeScenarioName,
      });
    }

    // ------------------------------------------------------------------
    // Colon Path Template Auto-Matching (e.g. /orders/:orderId/items/:itemIndex)
    // ------------------------------------------------------------------
    const requestSubpath = path ? "/" + path.join("/") : "/";
    const templatePath = endpoint.path_template || endpoint.path;
    if (templatePath && templatePath.includes(":")) {
      const parsedColon = parseColonPathTemplate(templatePath, requestSubpath);
      if (parsedColon.matched) {
        requestContext.params = {
          ...requestContext.params,
          ...parsedColon.params,
        };
      }
    }

    // ------------------------------------------------------------------
    // Conditional Response Rules Interceptor
    // ------------------------------------------------------------------
    const activeRules: ConditionalRule[] = endpoint.schema_json?.rules || endpoint.rules || [];
    for (const rule of activeRules) {
      if (evaluateConditionalRule(rule, { headers: requestHeaders, query: queryParams, body: requestBody })) {
        const ruleId = rule.id || `rule_${Math.random().toString(36).substring(2, 9)}`;

        // Handle Dual-Mode Proxy / Callout Execution (Beeceptor Neutralizer Phase)
        if (rule.calloutUrl) {
          const urlCheck = isSafeExternalUrl(rule.calloutUrl);
          if (!urlCheck.safe) {
            return NextResponse.json(
              { error: "SSRF Protection Blocked Request", reason: urlCheck.reason, targetUrl: rule.calloutUrl },
              { status: 400, headers: getRuleIdHeader(ruleId) }
            );
          }

          const method = (rule.calloutMethod || "POST").toUpperCase();

          let calloutBodyText = rule.calloutPayload;
          if (calloutBodyText) {
            calloutBodyText = evaluateTemplateString(calloutBodyText, {
              headers: requestHeaders,
              query: queryParams,
              body: requestBody,
            });
          } else if (requestBody) {
            calloutBodyText = JSON.stringify(requestBody);
          }

          if (rule.calloutMode === "sync") {
            try {
              const calloutRes = await fetch(rule.calloutUrl, {
                method,
                headers: {
                  "Content-Type": "application/json",
                  "X-Mockbit-Proxy-Trigger": ruleId,
                },
                body: method !== "GET" ? calloutBodyText : undefined,
              });

              const targetText = await calloutRes.text();
              let targetBody: any = targetText;
              try {
                targetBody = JSON.parse(targetText);
              } catch {
                // keep string
              }

              const responseHeaders = {
                ...getRuleIdHeader(ruleId),
                "X-Mockbit-Callout-Mode": "sync",
                "X-Mockbit-Target-Url": rule.calloutUrl,
              };

              if (typeof targetBody === "object") {
                return NextResponse.json(targetBody, {
                  status: calloutRes.status,
                  headers: responseHeaders,
                });
              } else {
                return new NextResponse(targetText, {
                  status: calloutRes.status,
                  headers: responseHeaders,
                });
              }
            } catch (err: any) {
              return NextResponse.json(
                { error: "Synchronous Callout Connection Failed", details: err.message, targetUrl: rule.calloutUrl },
                { status: 502, headers: getRuleIdHeader(ruleId) }
              );
            }
          } else {
            // Asynchronous Fire-and-Forget Mode
            fetch(rule.calloutUrl, {
              method,
              headers: {
                "Content-Type": "application/json",
                "X-Mockbit-Proxy-Trigger": ruleId,
              },
              body: method !== "GET" ? calloutBodyText : undefined,
            }).catch(() => {
              // non-blocking background error
            });
          }
        }

        let evaluatedBody = rule.responseBody || "";
        try {
          const defaultLocale = endpoint.locale || endpoint.schema_json?.locale;
          evaluatedBody = evaluateTemplateString(evaluatedBody, requestContext, defaultLocale);
        } catch (err: any) {
          return NextResponse.json(
            {
              error: {
                code: "template_syntax_error",
                message: `Template Syntax Error: ${err.message}`,
              },
            },
            { status: 561, headers: getRuleIdHeader(ruleId) }
          );
        }

        let parsedBody: any = { error: "Conditional Rule Triggered", rule_id: rule.id };
        try {
          parsedBody = JSON.parse(evaluatedBody);
        } catch {
          parsedBody = { message: evaluatedBody || "Conditional response rule matched" };
        }

        const headers: Record<string, string> = {
          ...getRuleIdHeader(ruleId),
          "X-Mockbit-Execution-Tier": "conditional_rule",
        };
        if (rule.calloutUrl && rule.calloutMode === "async") {
          headers["X-Mockbit-Callout-Mode"] = "async";
          headers["X-Mockbit-Target-Url"] = rule.calloutUrl;
        }

        return NextResponse.json(parsedBody, {
          status: rule.responseStatus || 200,
          headers,
        });
      }
    }

    // ------------------------------------------------------------------
    // Weighted Response Probability Split (e.g., 95% 200 vs 5% 500)
    // ------------------------------------------------------------------
    const schemaObj = endpoint.schema_json || {};
    const weightedResponses: WeightedResponseVariant[] = endpoint.weighted_responses ?? schemaObj.weighted_responses ?? [];
    if (weightedResponses.length > 0) {
      const selected = selectWeightedResponse(weightedResponses);
      if (selected) {
        const ruleId = selected.id || `weighted_rule_${selected.status}`;
        return NextResponse.json(
          selected.body ?? { message: `Weighted response variant (status ${selected.status})`, weight: selected.weight },
          {
            status: selected.status,
            headers: {
              ...getRuleIdHeader(ruleId),
              "X-Mockbit-Execution-Tier": "weighted_split",
            },
          }
        );
      }
    }
    const flakyRate = endpoint.flaky_error_rate ?? schemaObj.flaky_error_rate ?? endpoint.error_rate ?? 0;
    const flakyStatuses: number[] = endpoint.flaky_error_statuses ?? schemaObj.flaky_error_statuses ?? [endpoint.error_status || 500];

    if (flakyRate > 0 && Math.random() * 100 < flakyRate) {
      const errorStatus = Number(flakyStatuses[Math.floor(Math.random() * flakyStatuses.length)]) || 500;
      return NextResponse.json(
        {
          error: "Simulated Chaos Flaky Endpoint Failure",
          status: errorStatus,
          message: `Injected chaos failure (${flakyRate}% failure rate active)`,
          timestamp: new Date().toISOString(),
        },
        {
          status: errorStatus,
          headers: {
            ...CORS_HEADERS,
            "X-Mockbit-Chaos-Injected": "true",
          },
        }
      );
    }

    // Latency Jitter Calculation
    const minJitter = endpoint.latency_jitter_min ?? schemaObj.latency_jitter_min ?? endpoint.latency_ms ?? 0;
    const maxJitter = endpoint.latency_jitter_max ?? schemaObj.latency_jitter_max ?? endpoint.latency_ms ?? 0;

    let targetDelay = 0;
    if (maxJitter > 0) {
      const min = Math.min(minJitter, maxJitter);
      const max = Math.max(minJitter, maxJitter);
      targetDelay = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (endpoint.latency_ms && endpoint.latency_ms > 0) {
      targetDelay = endpoint.latency_ms;
    }

    if (targetDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(targetDelay, 10000)));
    }

    const storeKey = getStoreKey(user, endpointId, branch);
    const responseType: "object" | "array" = endpoint.response_type ?? "object";
    const arrayLength: number = endpoint.array_length ?? 10;
    const statusCode: number = endpoint.status_code ?? 200;
    const seed: number | undefined = endpoint.seed;
    const relations: EntityRelation[] = endpoint.schema_json?.relations || endpoint.relations || [];
    const scenarios: ScenarioPreset[] = endpoint.schema_json?.scenarios || endpoint.scenarios || [];

    const executionMs = Date.now() - startTime;

    // Non-blocking request logging
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
    const logTask = async () => {
      try {
        await supabaseAdmin.from("request_logs").insert({
          endpoint_id: endpoint.id,
          method: req.method,
          status_code: statusCode,
          ip_hash: ip,
          execution_ms: executionMs,
        });
      } catch {
        // Silently swallow log insert errors if DB is offline
      }
    };

    try {
      after(logTask);
    } catch {
      Promise.resolve().then(logTask);
    }

    return handleStatefulRequest({
      user,
      branch,
      endpointId,
      method,
      storeKey,
      path,
      schema: endpoint.schema_json,
      responseType,
      arrayLength,
      baseStatusCode: statusCode,
      req,
      requestContext,
      seed,
      relations,
      scenarios,
      activeScenarioName,
    });
  } catch {
    const storeKey = getStoreKey(user, endpointId, branch);
    return handleStatefulRequest({
      user,
      branch,
      endpointId,
      method,
      storeKey,
      path,
      schema: { fields: defaultFields },
      responseType: "array",
      arrayLength: 5,
      baseStatusCode: 200,
      req,
      requestContext,
      activeScenarioName,
    });
  }
}

// ---------------------------------------------------------------------------
// Stateful Relational CRUD Request Dispatcher
// ---------------------------------------------------------------------------
interface DispatchOptions {
  user: string;
  branch: string;
  endpointId: string;
  method: string;
  storeKey: string;
  path: string[] | undefined;
  schema: unknown;
  responseType: "object" | "array";
  arrayLength: number;
  baseStatusCode: number;
  req: NextRequest;
  requestContext?: RequestContext;
  seed?: number;
  relations?: EntityRelation[];
  scenarios?: ScenarioPreset[];
  activeScenarioName?: string;
  webhookUrl?: string;
  webhookSecret?: string;
}

async function handleStatefulRequest(opts: DispatchOptions): Promise<NextResponse> {
  const {
    user,
    branch,
    endpointId,
    method,
    storeKey,
    path,
    schema,
    responseType,
    arrayLength,
    baseStatusCode,
    req,
    requestContext,
    seed,
    relations = [],
    scenarios = [],
    activeScenarioName,
    webhookUrl,
    webhookSecret,
  } = opts;

  // Apply Scenario Preset if Header / Param specifies it
  if (activeScenarioName && scenarios.length > 0) {
    const preset = scenarios.find(
      (s) => s.name.toLowerCase() === activeScenarioName.toLowerCase() || s.id === activeScenarioName
    );
    if (preset) {
      applyScenarioPreset(storeKey, user, branch, endpointId, preset);
    }
  }

  // Support Nested Routes e.g., GET /users/usr_123/orders or /users/usr_123/orders/ord_99
  const isNestedRoute = path && path.length >= 2 && !path[0].startsWith("ord_") && !path[0].startsWith("usr_");
  
  if (isNestedRoute) {
    // path format e.g. ["usr_123", "orders"] or ["usr_123", "orders", "ord_99"]
    const parentId = path[0];
    const childEndpointSlug = path[1];
    const childResourceId = path[2] || null;

    const childStoreKey = getStoreKey(user, childEndpointSlug, branch);
    const childStore = getOrSeedStore(childStoreKey, schema, "array", arrayLength, requestContext, seed);
    const parentStore = getOrSeedStore(storeKey, schema, "array", arrayLength, requestContext, seed);

    const filtered = resolveNestedSubpathRecords(parentStore, parentId, childStore, childEndpointSlug, relations);

    if (childResourceId) {
      const item = filtered.find((r) => String(r["id"]) === childResourceId);
      if (!item) {
        return NextResponse.json(
          { error: `Resource ${childResourceId} not found under parent ${parentId}` },
          { status: 404, headers: CORS_HEADERS }
        );
      }
      return NextResponse.json(item, { status: baseStatusCode, headers: CORS_HEADERS });
    }

    return NextResponse.json(filtered, { status: baseStatusCode, headers: CORS_HEADERS });
  }

  const resourceId = path && path.length > 0 ? path[0] : null;

  switch (method) {
    // ----------------------------------------------------------------
    // GET — return store contents
    // ----------------------------------------------------------------
    case "GET": {
      const store = getOrSeedStore(storeKey, schema, responseType, arrayLength, requestContext, seed);
      const url = new URL(req.url);
      const searchParams = url.searchParams;

      // Handle subpath navigation (/users/1 or /users/1/orders or /users/1/orders/102)
      const targetRecords = path && path.length > 0 ? resolveNestedSubpathRecords(store, path) : store;

      if (path && path.length === 1 && targetRecords.length === 1 && !searchParams.toString()) {
        return NextResponse.json(targetRecords[0], { status: baseStatusCode, headers: CORS_HEADERS });
      }

      if (responseType === "object" && targetRecords.length > 0 && !searchParams.toString()) {
        return NextResponse.json(targetRecords[0], { status: baseStatusCode, headers: CORS_HEADERS });
      }

      // Apply pagination, sorting, and filtering
      const queryResult = applyQueryParameters(targetRecords, searchParams);

      const headers = {
        ...CORS_HEADERS,
        ...getRuleIdHeader("rule_default_crud"),
        "X-Total-Count": String(queryResult.total),
        "X-Page": String(queryResult.page),
        "X-Per-Page": String(queryResult.limit),
      };

      return NextResponse.json(queryResult.data, { status: baseStatusCode, headers });
    }

    // ----------------------------------------------------------------
    // POST — create record and append to store
    // ----------------------------------------------------------------
    case "POST": {
      let body: Record<string, unknown> = {};
      try {
        body = await req.json();
      } catch {
        body = {};
      }
      if (!body["id"]) {
        body["id"] = crypto.randomUUID();
      }
      if (!body["created_at"]) {
        body["created_at"] = new Date().toISOString();
      }
      const store = getOrSeedStore(storeKey, schema, responseType, arrayLength, requestContext, seed);
      store.push(body);
      setStoreData(storeKey, store);

      recordTransaction(
        user,
        branch,
        endpointId,
        "POST",
        `+ ${endpointId}[${store.length - 1}] (${String(body["id"]).slice(0, 8)})`,
        store,
        String(body["id"])
      );

      if (webhookUrl) {
        dispatchWebhook(webhookUrl, webhookSecret, "POST", body, endpointId);
      }

      return NextResponse.json(body, { status: 201, headers: CORS_HEADERS });
    }

    // ----------------------------------------------------------------
    // PUT — full replace of record by ID
    // ----------------------------------------------------------------
    case "PUT": {
      if (!resourceId) {
        return NextResponse.json({ error: "PUT requires a resource ID in the path" }, { status: 400, headers: CORS_HEADERS });
      }
      let body: Record<string, unknown> = {};
      try {
        body = await req.json();
      } catch {
        body = {};
      }
      const store = getOrSeedStore(storeKey, schema, responseType, arrayLength, requestContext, seed);
      const idx = store.findIndex((r) => String(r["id"]) === resourceId);
      if (idx === -1) {
        return NextResponse.json({ error: "Resource not found", id: resourceId }, { status: 404, headers: CORS_HEADERS });
      }
      const updated = { ...body, id: resourceId };
      store[idx] = updated;
      setStoreData(storeKey, store);

      recordTransaction(
        user,
        branch,
        endpointId,
        "PUT",
        `= ${endpointId}[${idx}] (${resourceId.slice(0, 8)})`,
        store,
        resourceId
      );

      if (webhookUrl) {
        dispatchWebhook(webhookUrl, webhookSecret, "PUT", updated, endpointId);
      }

      return NextResponse.json(updated, { status: 200, headers: CORS_HEADERS });
    }

    // ----------------------------------------------------------------
    // PATCH — partial update of record by ID
    // ----------------------------------------------------------------
    case "PATCH": {
      if (!resourceId) {
        return NextResponse.json({ error: "PATCH requires a resource ID in the path" }, { status: 400, headers: CORS_HEADERS });
      }
      let body: Record<string, unknown> = {};
      try {
        body = await req.json();
      } catch {
        body = {};
      }
      const store = getOrSeedStore(storeKey, schema, responseType, arrayLength, requestContext, seed);
      const idx = store.findIndex((r) => String(r["id"]) === resourceId);
      if (idx === -1) {
        return NextResponse.json({ error: "Resource not found", id: resourceId }, { status: 404, headers: CORS_HEADERS });
      }

      const keys = Object.keys(body).filter((k) => k !== "id");
      const diffSummary = keys.length > 0 ? `~ ${keys.join(", ")}` : "~ updated record";

      const patched = { ...store[idx], ...body, id: resourceId };
      store[idx] = patched;
      setStoreData(storeKey, store);

      recordTransaction(user, branch, endpointId, "PATCH", diffSummary, store, resourceId);

      if (webhookUrl) {
        dispatchWebhook(webhookUrl, webhookSecret, "PUT", patched, endpointId);
      }

      return NextResponse.json(patched, { status: 200, headers: CORS_HEADERS });
    }

    // ----------------------------------------------------------------
    // DELETE — remove record by ID with Cascade Delete
    // ----------------------------------------------------------------
    case "DELETE": {
      if (!resourceId) {
        setStoreData(storeKey, []);
        recordTransaction(user, branch, endpointId, "DELETE", "- purged all records", []);
        return NextResponse.json({ message: "All resources deleted", store: storeKey }, { status: 200, headers: CORS_HEADERS });
      }
      const store = getOrSeedStore(storeKey, schema, responseType, arrayLength, requestContext, seed);
      const idx = store.findIndex((r) => String(r["id"]) === resourceId);
      if (idx === -1) {
        return NextResponse.json({ error: "Resource not found", id: resourceId }, { status: 404, headers: CORS_HEADERS });
      }
      const removed = store.splice(idx, 1)[0];
      setStoreData(storeKey, store);

      // Execute Cascade Delete across dependent endpoint stores
      const cascadeRes = executeCascadeDelete(user, branch, endpointId, String(removed["id"] || resourceId), relations);

      const diffMsg = `- ${endpointId} (${resourceId.slice(0, 8)})${
        cascadeRes.cascadeCount > 0 ? ` + cascade (${cascadeRes.cascadeCount} items)` : ""
      }`;

      recordTransaction(user, branch, endpointId, "DELETE", diffMsg, store, resourceId);

      if (webhookUrl) {
        dispatchWebhook(webhookUrl, webhookSecret, "DELETE", removed, endpointId);
      }

      return NextResponse.json(
        { message: "Resource deleted", deleted: removed, cascadeDeleted: cascadeRes.cascadeCount },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    case "OPTIONS":
      return new NextResponse(null, { status: 204, headers: CORS_HEADERS });

    default:
      return NextResponse.json({ error: `Method ${method} not supported` }, { status: 405, headers: CORS_HEADERS });
  }
}
