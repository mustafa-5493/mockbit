import { FieldDefinition } from "@/lib/mock-generator";
import { isSafeExternalUrl } from "@/lib/url-safety";

export interface RecordedProxyTraffic {
  targetUrl: string;
  method: string;
  statusCode: number;
  headers: Record<string, string>;
  responseBody: any;
  inferredFields: FieldDefinition[];
  responseType: "object" | "array";
  arrayLength: number;
}

/**
 * Infer Mockbit FieldDefinitions from a recorded JSON payload object or array
 */
export function inferFieldsFromPayload(payload: any): FieldDefinition[] {
  if (!payload) return [];

  const sampleObj = Array.isArray(payload) ? payload[0] : payload;
  if (!sampleObj || typeof sampleObj !== "object") return [];

  const fields: FieldDefinition[] = [];

  Object.entries(sampleObj).forEach(([key, val]) => {
    const lowerKey = key.toLowerCase();
    let type: FieldDefinition["type"] = "lorem";

    if (lowerKey === "id" || lowerKey === "_id" || lowerKey.includes("uuid")) type = "uuid";
    else if (lowerKey.includes("first_name") || lowerKey.includes("firstname")) type = "firstName";
    else if (lowerKey.includes("last_name") || lowerKey.includes("lastname")) type = "lastName";
    else if (lowerKey.includes("name")) type = "fullName";
    else if (lowerKey.includes("email")) type = "email";
    else if (lowerKey.includes("avatar") || lowerKey.includes("image") || lowerHeaderMatch(lowerKey, ["picture", "img", "photo"])) type = "avatar";
    else if (lowerKey.includes("phone")) type = "phone";
    else if (lowerKey.includes("city")) type = "city";
    else if (lowerKey.includes("country")) type = "country";
    else if (lowerKey.includes("address")) type = "address";
    else if (lowerKey.includes("company")) type = "company";
    else if (lowerKey.includes("price") || lowerKey.includes("cost") || lowerKey.includes("amount")) type = "currency";
    else if (lowerKey.includes("date") || lowerKey.includes("created") || lowerKey.includes("updated")) type = "date";
    else if (lowerKey.includes("url") || lowerKey.includes("website")) type = "url";
    else if (typeof val === "boolean") type = "boolean";
    else if (typeof val === "number") type = "number";
    else if (Array.isArray(val)) type = "array";
    else if (typeof val === "object" && val !== null) type = "object";

    fields.push({ name: key, type });
  });

  return fields;
}

function lowerHeaderMatch(str: string, terms: string[]): boolean {
  return terms.some((t) => str.includes(t));
}

/**
 * Execute HTTP proxy request to target endpoint and record response schema
 */
export async function recordProxyRequest(targetUrl: string, method: string = "GET", headers?: Record<string, string>, body?: any): Promise<RecordedProxyTraffic> {
  const urlCheck = isSafeExternalUrl(targetUrl);
  if (!urlCheck.safe) {
    throw new Error(`SSRF Blocked: ${urlCheck.reason}`);
  }

  const reqHeaders: Record<string, string> = {
    "accept": "application/json",
    ...headers,
  };

  const init: RequestInit = {
    method: method.toUpperCase(),
    headers: reqHeaders,
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
    reqHeaders["content-type"] = "application/json";
  }

  const response = await fetch(targetUrl, init);
  const responseText = await response.text();

  let responseBody: any = responseText;
  try {
    responseBody = JSON.parse(responseText);
  } catch {
    // Keep as text if not JSON
  }

  const responseType = Array.isArray(responseBody) ? "array" : "object";
  const arrayLength = Array.isArray(responseBody) ? responseBody.length : 1;
  const inferredFields = inferFieldsFromPayload(responseBody);

  const resHeaders: Record<string, string> = {};
  response.headers.forEach((v, k) => {
    resHeaders[k] = v;
  });

  return {
    targetUrl,
    method: method.toUpperCase(),
    statusCode: response.status,
    headers: resHeaders,
    responseBody,
    inferredFields,
    responseType,
    arrayLength,
  };
}
