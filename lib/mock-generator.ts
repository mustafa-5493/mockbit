import {
  faker,
  fakerZH_CN,
  fakerJA,
  fakerFR,
  fakerES,
  fakerES_MX,
  fakerPT_BR,
  fakerID_ID,
  fakerEN_GB,
  fakerEN_IN,
  fakerEN_US,
  fakerEN,
} from "@faker-js/faker";

export function getLocalizedFaker(localeCode?: string): any {
  if (!localeCode) return faker;
  const normalized = localeCode.toLowerCase().replace("-", "_").trim();
  switch (normalized) {
    case "zh_cn":
    case "zh":
      return fakerZH_CN || faker;
    case "ja":
    case "ja_jp":
      return fakerJA || faker;
    case "fr":
    case "fr_fr":
      return fakerFR || faker;
    case "es":
    case "es_es":
      return fakerES || faker;
    case "es_mx":
      return fakerES_MX || faker;
    case "pt_br":
    case "pt":
      return fakerPT_BR || faker;
    case "id_id":
    case "id":
      return fakerID_ID || faker;
    case "en_gb":
      return fakerEN_GB || faker;
    case "en_in":
      return fakerEN_IN || faker;
    case "en_us":
      return fakerEN_US || faker;
    case "en":
    default:
      return fakerEN || faker;
  }
}

export interface FieldDefinition {
  name: string;
  type:
    | "uuid"
    | "fullName"
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "avatar"
    | "city"
    | "country"
    | "address"
    | "zipCode"
    | "company"
    | "jobTitle"
    | "date"
    | "futureDate"
    | "number"
    | "boolean"
    | "currency"
    | "enum"
    | "lorem"
    | "url"
    | "ip"
    | "mac"
    | "ssn"
    | "bcrypt"
    | "object"
    | "array"
    | "template";
  min?: number;
  max?: number;
  template?: string; // Mustache template e.g. "{{person.firstName}} {{person.lastName}}" or "{{params.id}}"
  options?: string[];
  fields?: FieldDefinition[];
}

export interface RequestContext {
  params?: Record<string, string>;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: Record<string, any>;
}

export interface ConditionalRule {
  id: string;
  target: "header" | "query" | "body" | "soap_action";
  key: string;
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "missing" | "is_null" | "is_not_null" | "greater_than" | "less_than";
  value: string;
  responseStatus: number;
  responseBody: string;

  // HTTP Callout Rule Configuration (Beeceptor Neutralizer Phase)
  calloutUrl?: string;
  calloutMode?: "sync" | "async";
  calloutMethod?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  calloutPayload?: string;
}

export interface EntityRelation {
  id: string;
  targetEndpoint: string; // e.g. "users"
  foreignKey: string;     // e.g. "user_id"
  targetKey: string;      // e.g. "id"
  type: "belongsTo" | "hasMany";
  onDelete?: "cascade" | "setNull" | "restrict";
}

export interface ScenarioPreset {
  id: string;
  name: string; // e.g. "Expired Credit Card", "Empty Inventory"
  description?: string;
  records: Record<string, unknown>[];
  statusCode?: number;
}

export interface StateSnapshot {
  id: string;
  name: string; // e.g. "pre-checkout-checkpoint"
  branch: string;
  created_at: string;
  storeData: Record<string, Record<string, unknown>[]>;
}

export interface TransactionLogEntry {
  version: number;
  timestamp: string;
  user: string;
  branch: string;
  endpointId: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE" | "SYSTEM" | "REWIND";
  resourceId?: string;
  diff: string;
  snapshotState: Record<string, unknown>[];
}

export interface MockSchemaConfig {
  responseType?: "object" | "array";
  arrayLength?: number;
  seed?: number;
  latency_jitter_min?: number;
  latency_jitter_max?: number;
  flaky_error_rate?: number;
  flaky_error_statuses?: number[];
  simulate_timeout?: boolean;
  rules?: ConditionalRule[];
  relations?: EntityRelation[];
  scenarios?: ScenarioPreset[];
  fields?: FieldDefinition[];
  [key: string]: any;
}

export interface RuleEvaluationResult {
  matched: boolean;
  rule?: ConditionalRule;
  reason?: string;
  actualValue?: any;
}

/**
 * Evaluates a single ConditionalRule against incoming request headers, query params, or JSON body.
 */
export function evaluateConditionalRule(
  rule: ConditionalRule,
  reqContext: {
    headers?: Record<string, string>;
    query?: Record<string, string>;
    body?: Record<string, any>;
  }
): boolean {
  return evaluateConditionalRuleDetailed(rule, reqContext).matched;
}

/**
 * Evaluates a ConditionalRule returning rich diagnostic information and match reasons.
 */
/**
 * Resolves deeply nested object fields, array indexed elements, and metadata using dot notation
 * Examples:
 * - getNestedValueByDotNotation({ user: { preferences: { theme: 'dark' } } }, 'user.preferences.theme') => 'dark'
 * - getNestedValueByDotNotation({ items: [{ name: 'item1' }] }, 'items[0].name') => 'item1'
 * - getNestedValueByDotNotation({ items: [1, 2, 3] }, 'items.length') => 3
 */
export function getNestedValueByDotNotation(obj: any, path: string): any {
  if (!obj || typeof obj !== "object" || !path || typeof path !== "string") {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(obj, path) && obj[path] !== undefined) {
    return obj[path];
  }

  const normalizedPath = path.replace(/\[(\d+)\]/g, ".$1");
  const parts = normalizedPath.split(".").filter(Boolean);

  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    if (current === null || current === undefined) {
      return undefined;
    }

    if (key === "length" && Array.isArray(current)) {
      return current.length;
    }

    current = current[key];
  }

  return current;
}

/**
 * Extracts SOAP operation identifier across 4 prioritized sources:
 * 1. Content-Type header action="..." parameter
 * 2. SOAPAction HTTP header
 * 3. WS-Addressing <Action> XML element
 * 4. SOAP Body XML operation tag
 */
export function extractSoapAction(headers?: Record<string, string>, bodyRaw?: any, urlPath?: string): string | null {
  if (!headers && !bodyRaw) return null;

  const normalizedHeaders: Record<string, string> = {};
  if (headers) {
    Object.keys(headers).forEach((k) => {
      normalizedHeaders[k.toLowerCase()] = headers[k];
    });
  }

  // Priority 1: Content-Type header parameter action="..."
  const contentType = normalizedHeaders["content-type"] || "";
  const ctActionMatch = contentType.match(/action=["']?([^"';]+)["']?/i);
  if (ctActionMatch && ctActionMatch[1]) {
    return ctActionMatch[1].trim();
  }

  // Priority 2: SOAPAction HTTP Header
  const soapActionHeader = normalizedHeaders["soapaction"];
  if (soapActionHeader) {
    return soapActionHeader.replace(/^["']|["']$/g, "").trim();
  }

  // Convert raw body to string if needed
  const bodyText = typeof bodyRaw === "string" ? bodyRaw : typeof bodyRaw === "object" ? JSON.stringify(bodyRaw) : "";

  if (bodyText) {
    // Priority 3: WS-Addressing <Action> XML element
    const wsActionMatch = bodyText.match(/<[^:]*:?Action[^>]*>([^<]+)<\/[^:]*:?Action>/i);
    if (wsActionMatch && wsActionMatch[1]) {
      return wsActionMatch[1].trim();
    }

    // Priority 4: SOAP Body operation XML tag (first child tag inside <soap:Body>)
    const bodyXmlMatch = bodyText.match(/<[^:]*:?Body[^>]*>\s*<([^>\s/]+)/i);
    if (bodyXmlMatch && bodyXmlMatch[1]) {
      const tag = bodyXmlMatch[1];
      const cleanTag = tag.includes(":") ? tag.split(":")[1] : tag;
      return cleanTag.trim();
    }
  }

  // Priority 5: URL Path final segment fallback
  if (urlPath && typeof urlPath === "string") {
    const cleanPath = urlPath.split("?")[0].replace(/\/+$/, "");
    const segments = cleanPath.split("/").filter(Boolean);
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      if (lastSegment && !["ws", "soap", "api", "v1", "v2"].includes(lastSegment.toLowerCase())) {
        return lastSegment;
      }
    }
  }

  return null;
}

export function evaluateConditionalRuleDetailed(
  rule: ConditionalRule,
  reqContext: {
    headers?: Record<string, string>;
    query?: Record<string, string>;
    body?: Record<string, any>;
  }
): RuleEvaluationResult {
  if (!rule || !rule.target) {
    return { matched: false, reason: "Invalid rule definition" };
  }

  let actualVal: any = undefined;
  const targetLabel = rule.target.toUpperCase();
  const keyLabel = rule.key || "(unspecified)";

  if (rule.target === "header") {
    const searchKey = (rule.key || "").toLowerCase();
    actualVal = reqContext.headers ? reqContext.headers[searchKey] || reqContext.headers[rule.key] : undefined;
  } else if (rule.target === "query") {
    actualVal = reqContext.query ? reqContext.query[rule.key] : undefined;
  } else if (rule.target === "body") {
    actualVal = reqContext.body ? getNestedValueByDotNotation(reqContext.body, rule.key) ?? reqContext.body[rule.key] : undefined;
  } else if (rule.target === "soap_action") {
    actualVal = extractSoapAction(reqContext.headers, reqContext.body);
  }

  const expectedVal = rule.value ?? "";

  switch (rule.operator) {
    case "missing":
    case "is_null": {
      const isMissing = actualVal === undefined || actualVal === null || actualVal === "";
      return {
        matched: isMissing,
        rule,
        actualValue: actualVal ?? "undefined",
        reason: isMissing
          ? `${targetLabel} '${keyLabel}' is MISSING or NULL in incoming request`
          : `${targetLabel} '${keyLabel}' was PRESENT in request (value: "${actualVal}")`,
      };
    }
    case "is_not_null": {
      const isNotNull = actualVal !== undefined && actualVal !== null && actualVal !== "";
      return {
        matched: isNotNull,
        rule,
        actualValue: actualVal,
        reason: isNotNull
          ? `${targetLabel} '${keyLabel}' is PRESENT and NOT NULL (value: "${actualVal}")`
          : `${targetLabel} '${keyLabel}' was MISSING or NULL in request`,
      };
    }
    case "equals": {
      const isEquals = String(actualVal ?? "").toLowerCase() === expectedVal.toLowerCase();
      return {
        matched: isEquals,
        rule,
        actualValue: actualVal,
        reason: isEquals
          ? `${targetLabel} '${keyLabel}' EQUALS "${expectedVal}"`
          : `${targetLabel} '${keyLabel}' was "${actualVal}" (expected "${expectedVal}")`,
      };
    }
    case "not_equals": {
      const isNotEquals = String(actualVal ?? "").toLowerCase() !== expectedVal.toLowerCase();
      return {
        matched: isNotEquals,
        rule,
        actualValue: actualVal,
        reason: isNotEquals
          ? `${targetLabel} '${keyLabel}' DOES NOT EQUAL "${expectedVal}" (value: "${actualVal}")`
          : `${targetLabel} '${keyLabel}' EQUALED "${expectedVal}"`,
      };
    }
    case "contains": {
      const isContains = Array.isArray(actualVal)
        ? actualVal.some((item) => String(item).toLowerCase().includes(expectedVal.toLowerCase()))
        : String(actualVal ?? "").toLowerCase().includes(expectedVal.toLowerCase());
      return {
        matched: isContains,
        rule,
        actualValue: actualVal,
        reason: isContains
          ? `${targetLabel} '${keyLabel}' CONTAINS "${expectedVal}" (value: "${actualVal}")`
          : `${targetLabel} '${keyLabel}' ("${actualVal}") DID NOT CONTAIN "${expectedVal}"`,
      };
    }
    case "not_contains": {
      const isContains = Array.isArray(actualVal)
        ? actualVal.some((item) => String(item).toLowerCase().includes(expectedVal.toLowerCase()))
        : String(actualVal ?? "").toLowerCase().includes(expectedVal.toLowerCase());
      return {
        matched: !isContains,
        rule,
        actualValue: actualVal,
        reason: !isContains
          ? `${targetLabel} '${keyLabel}' DOES NOT CONTAIN "${expectedVal}"`
          : `${targetLabel} '${keyLabel}' CONTAINED "${expectedVal}"`,
      };
    }
    case "greater_than": {
      const numActual = Number(actualVal);
      const numExpected = Number(expectedVal);
      const isGreater = !isNaN(numActual) && !isNaN(numExpected) && numActual > numExpected;
      return {
        matched: isGreater,
        rule,
        actualValue: actualVal,
        reason: isGreater
          ? `${targetLabel} '${keyLabel}' (${numActual}) IS GREATER THAN ${numExpected}`
          : `${targetLabel} '${keyLabel}' (${numActual}) WAS NOT GREATER THAN ${numExpected}`,
      };
    }
    case "less_than": {
      const numActual = Number(actualVal);
      const numExpected = Number(expectedVal);
      const isLess = !isNaN(numActual) && !isNaN(numExpected) && numActual < numExpected;
      return {
        matched: isLess,
        rule,
        actualValue: actualVal,
        reason: isLess
          ? `${targetLabel} '${keyLabel}' (${numActual}) IS LESS THAN ${numExpected}`
          : `${targetLabel} '${keyLabel}' (${numActual}) WAS NOT LESS THAN ${numExpected}`,
      };
    }
    default:
      return { matched: false, rule, reason: "Unknown operator" };
  }
}

export function escapeHtml(str: string): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/=/g, "&#x3D;");
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((pair) => {
    const parts = pair.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  });
  return cookies;
}

/**
 * Parses application/x-www-form-urlencoded raw body string into JSON.
 * Supports single key-value pairs and repeated key arrays (e.g. key1=v1&key1=v2 -> key1: "v1,v2", key1.0: "v1", key1.1: "v2")
 */
export function parseFormUrlEncodedBody(rawText: string): Record<string, any> {
  const result: Record<string, any> = {};
  if (!rawText || typeof rawText !== "string") return result;

  try {
    const params = new URLSearchParams(rawText);
    const grouped: Record<string, string[]> = {};

    params.forEach((val, key) => {
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(val);
    });

    Object.keys(grouped).forEach((key) => {
      const list = grouped[key];
      if (list.length === 1) {
        result[key] = list[0];
      } else {
        result[key] = list.join(",");
        list.forEach((item, index) => {
          result[`${key}.${index}`] = item;
        });
      }
    });
  } catch {
    // Fallback plain parse
  }

  return result;
}

/**
 * Fast XML to JSON Converter for Beeceptor Neutralizer.
 * Converts XML attributes into @_attributeName and node text into #text.
 */
export function parseXmlToJson(xmlText: string): Record<string, any> {
  if (!xmlText || typeof xmlText !== "string") return {};

  const cleanXml = xmlText.trim().replace(/^<\?xml[^>]*\?>/i, "").trim();

  const parseNode = (xmlStr: string): any => {
    const tagMatch = xmlStr.match(/^<([a-zA-Z0-9_:-]+)([^>]*)>([\s\S]*)<\/\1>$/i) || xmlStr.match(/^<([a-zA-Z0-9_:-]+)([^>]*)\/>$/i);
    if (!tagMatch) {
      return xmlStr.trim();
    }

    const tagName = tagMatch[1];
    const rawAttrs = tagMatch[2] || "";
    const content = tagMatch[3] !== undefined ? tagMatch[3].trim() : "";

    const nodeObj: Record<string, any> = {};

    const attrRegex = /([a-zA-Z0-9_:-]+)=["']([^"']*)["']/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      const attrName = attrMatch[1].includes(":") ? attrMatch[1].split(":")[1] : attrMatch[1];
      nodeObj[`@_${attrName}`] = attrMatch[2];
    }

    if (!content) {
      return Object.keys(nodeObj).length > 0 ? nodeObj : {};
    }

    if (/<[a-zA-Z0-9_:-]+[^>]*>/i.test(content)) {
      const childRegex = /<([a-zA-Z0-9_:-]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9_:-]+)([^>]*)\/>/g;
      let childMatch;
      const childrenMap: Record<string, any[]> = {};

      while ((childMatch = childRegex.exec(content)) !== null) {
        const childTag = childMatch[1] || childMatch[4];
        const cleanChildTag = childTag.includes(":") ? childTag.split(":")[1] : childTag;
        const childSnippet = childMatch[0];

        if (!childrenMap[cleanChildTag]) childrenMap[cleanChildTag] = [];
        childrenMap[cleanChildTag].push(parseNode(childSnippet));
      }

      Object.keys(childrenMap).forEach((childKey) => {
        const list = childrenMap[childKey];
        nodeObj[childKey] = list.length === 1 ? list[0] : list;
      });
      return nodeObj;
    } else {
      if (Object.keys(nodeObj).length > 0) {
        nodeObj["#text"] = content;
        return nodeObj;
      } else {
        return content;
      }
    }
  };

  try {
    const rootTagMatch = cleanXml.match(/^<([a-zA-Z0-9_:-]+)/i);
    const rootName = rootTagMatch ? (rootTagMatch[1].includes(":") ? rootTagMatch[1].split(":")[1] : rootTagMatch[1]) : "xml";
    const parsed = parseNode(cleanXml);
    return { [rootName]: parsed };
  } catch {
    return {};
  }
}

/**
 * Date formatting engine supporting 15+ shorthand notations and custom patterns.
 */
export function formatFakerDate(dateObj: Date, formatSpec?: string): string {
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return new Date().toISOString();
  }

  if (!formatSpec) return dateObj.toISOString();

  const fmt = formatSpec.toLowerCase().trim();

  if (fmt === "iso" || fmt === "iso8601") {
    return dateObj.toISOString();
  } else if (fmt === "utc" || fmt === "rfc3339" || fmt === "w3c") {
    return dateObj.toISOString().replace(/\.\d{3}Z$/, "Z");
  } else if (fmt === "timestamp") {
    return String(dateObj.getTime());
  } else if (fmt === "unix") {
    return String(Math.floor(dateObj.getTime() / 1000));
  } else if (fmt === "us") {
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const yyyy = dateObj.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } else if (fmt === "eu") {
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const yyyy = dateObj.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } else if (fmt === "sql" || fmt === "long") {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const hh = String(dateObj.getHours()).padStart(2, "0");
    const min = String(dateObj.getMinutes()).padStart(2, "0");
    const ss = String(dateObj.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  } else if (fmt === "short") {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } else if (fmt === "compact") {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const hh = String(dateObj.getHours()).padStart(2, "0");
    const min = String(dateObj.getMinutes()).padStart(2, "0");
    const ss = String(dateObj.getSeconds()).padStart(2, "0");
    return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
  } else if (fmt === "full" || fmt === "rfc2822") {
    return dateObj.toUTCString();
  }

  let custom = formatSpec;
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const hh = String(dateObj.getHours()).padStart(2, "0");
  const min = String(dateObj.getMinutes()).padStart(2, "0");
  const ss = String(dateObj.getSeconds()).padStart(2, "0");
  const ms = String(dateObj.getMilliseconds()).padStart(3, "0");

  custom = custom.replace(/YYYY/g, String(yyyy));
  custom = custom.replace(/MM/g, mm);
  custom = custom.replace(/DD/g, dd);
  custom = custom.replace(/HH/g, hh);
  custom = custom.replace(/mm/g, min);
  custom = custom.replace(/ss/g, ss);
  custom = custom.replace(/SSS/g, ms);
  return custom;
}

/**
 * Handles explicit Handlebars {{faker 'namespace.method' 'arg2' 'arg3'}} helper execution.
 */
export function evaluateFakerHelper(pathKey: string, arg2?: string, arg3?: string, localeCode?: string): string {
  const targetFaker = getLocalizedFaker(localeCode);
  const parts = pathKey.split(".");
  if (parts.length < 2) {
    return `Faker Attribute Error: Missing or wrong syntax for '${pathKey}'`;
  }

  const namespace = parts[0];
  const subMethod = parts[1];

  const fakerNs = targetFaker[namespace];
  if (!fakerNs || typeof fakerNs[subMethod] !== "function") {
    return `Faker Attribute Error: Missing or wrong syntax for '${pathKey}'`;
  }

  try {
    const fn = fakerNs[subMethod];

    // Handle number namespace
    if (namespace === "number") {
      let opts: any = {};
      if (arg2) {
        if (arg2.startsWith("{") && arg2.endsWith("}")) {
          try {
            const jsonLike = arg2.replace(/([a-zA-Z0-9_]+):/g, '"$1":').replace(/'/g, '"');
            opts = JSON.parse(jsonLike);
          } catch {
            opts = {};
          }
        } else if (!isNaN(Number(arg2))) {
          opts = { max: Number(arg2) };
        }
      }
      const numVal = fn.call(fakerNs, opts);
      return String(numVal);
    }

    // Handle date namespace
    if (namespace === "date") {
      if (subMethod === "between" && arg2 && arg2.startsWith("{")) {
        const fromMatch = arg2.match(/from:\s*["']([^"']+)["']/i);
        const toMatch = arg2.match(/to:\s*["']([^"']+)["']/i);
        const fromDate = fromMatch ? new Date(fromMatch[1]) : new Date(Date.now() - 86400000);
        const toDate = toMatch ? new Date(toMatch[1]) : new Date();
        const betweenDate = targetFaker.date.between({ from: fromDate, to: toDate });
        return formatFakerDate(betweenDate, arg3 || "iso");
      }

      const dateResult = fn.call(fakerNs);
      if (dateResult instanceof Date) {
        return formatFakerDate(dateResult, arg2);
      }
      return String(dateResult);
    }

    // Default call
    const res = fn.call(fakerNs, arg2 ? arg2 : undefined);
    if (res instanceof Date) {
      return formatFakerDate(res, arg2);
    }
    return typeof res === "object" ? JSON.stringify(res) : String(res);
  } catch (err: any) {
    return `Faker Attribute Error: ${err.message || "Missing or wrong syntax"}`;
  }
}

/**
 * Evaluates arithmetic operations: add, subtract, multiply, divide, modulo, floor, ceil, round, toFixed
 */
export function evaluateArithmeticOperator(op: string, rawArgs: string[], context?: RequestContext): string {
  const nums = rawArgs.map((a) => {
    const evaluated = evaluateSubExpression(a, context);
    const n = Number(evaluated);
    return isNaN(n) ? 0 : n;
  });

  const opLower = op.toLowerCase();

  switch (opLower) {
    case "add": {
      const sum = nums.reduce((acc, curr) => acc + curr, 0);
      return String(sum);
    }
    case "subtract": {
      if (nums.length === 0) return "0";
      const first = nums[0];
      const result = nums.slice(1).reduce((acc, curr) => acc - curr, first);
      return String(result);
    }
    case "multiply": {
      if (nums.length === 0) return "0";
      const result = nums.reduce((acc, curr) => acc * curr, 1);
      return String(result);
    }
    case "divide": {
      if (nums.length === 0) return "0";
      let result = nums[0];
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] === 0) return "Error: Division by zero";
        result = result / nums[i];
      }
      return String(result);
    }
    case "modulo": {
      if (nums.length < 2) return "0";
      if (nums[1] === 0) return "Error: Division by zero";
      return String(nums[0] % nums[1]);
    }
    case "floor": {
      return String(Math.floor(nums[0] || 0));
    }
    case "ceil": {
      return String(Math.ceil(nums[0] || 0));
    }
    case "round": {
      return String(Math.round(nums[0] || 0));
    }
    case "tofixed": {
      const val = nums[0] || 0;
      const digits = nums[1] !== undefined ? nums[1] : 2;
      return String(val.toFixed(digits));
    }
    default:
      return "0";
  }
}

/**
 * Evaluates string & array operations: lowercase, uppercase, trim, slugify, stripTags, urlEncode, urlDecode, base64, base64Decode, padStart, padEnd, split, concat, contains, replace, array
 */
export function evaluateStringOperator(op: string, rawArgs: string[], context?: RequestContext): any {
  const evaluatedArgs = rawArgs.map((a) => evaluateSubExpression(a, context));
  const opLower = op.toLowerCase();

  switch (opLower) {
    case "lowercase": {
      return String(evaluatedArgs[0] || "").toLowerCase();
    }
    case "uppercase": {
      return String(evaluatedArgs[0] || "").toUpperCase();
    }
    case "trim": {
      return String(evaluatedArgs[0] || "").trim();
    }
    case "slugify": {
      const str = String(evaluatedArgs[0] || "");
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
    }
    case "striptags": {
      const str = String(evaluatedArgs[0] || "");
      return str.replace(/<[^>]*>?/gm, "");
    }
    case "urlencode": {
      return encodeURIComponent(String(evaluatedArgs[0] || ""));
    }
    case "urldecode": {
      try {
        return decodeURIComponent(String(evaluatedArgs[0] || ""));
      } catch {
        return String(evaluatedArgs[0] || "");
      }
    }
    case "base64": {
      return Buffer.from(String(evaluatedArgs[0] || "")).toString("base64");
    }
    case "base64decode": {
      try {
        return Buffer.from(String(evaluatedArgs[0] || ""), "base64").toString("utf-8");
      } catch {
        return String(evaluatedArgs[0] || "");
      }
    }
    case "padstart": {
      const str = String(evaluatedArgs[0] || "");
      const len = Number(evaluatedArgs[1] || 0);
      const padChar = evaluatedArgs[2] !== undefined ? String(evaluatedArgs[2]) : " ";
      return str.padStart(len, padChar);
    }
    case "padend": {
      const str = String(evaluatedArgs[0] || "");
      const len = Number(evaluatedArgs[1] || 0);
      const padChar = evaluatedArgs[2] !== undefined ? String(evaluatedArgs[2]) : " ";
      return str.padEnd(len, padChar);
    }
    case "split": {
      const str = String(evaluatedArgs[0] || "");
      const sep = evaluatedArgs[1] !== undefined ? String(evaluatedArgs[1]) : " ";
      const parts = str.split(sep);
      const parsedParts = parts.map((p) => (!isNaN(Number(p.trim())) && p.trim() !== "" ? Number(p.trim()) : p));
      return JSON.stringify(parsedParts);
    }
    case "concat": {
      let resultItems: any[] = [];
      let isArrayConcat = false;

      for (const arg of evaluatedArgs) {
        if (Array.isArray(arg)) {
          isArrayConcat = true;
          resultItems.push(...arg);
        } else {
          resultItems.push(arg);
        }
      }

      if (isArrayConcat) {
        return JSON.stringify(resultItems);
      }
      return resultItems.map(String).join("");
    }
    case "contains": {
      const mainVal = evaluatedArgs[0];
      const targetVal = evaluatedArgs[1];
      if (Array.isArray(mainVal)) {
        return mainVal.includes(targetVal) || mainVal.includes(String(targetVal)) || mainVal.includes(Number(targetVal));
      }
      const str = String(mainVal || "");
      return str.includes(String(targetVal || ""));
    }
    case "replace": {
      const str = String(evaluatedArgs[0] || "");
      const findMe = String(evaluatedArgs[1] || "");
      const replaceWith = String(evaluatedArgs[2] || "");
      return str.split(findMe).join(replaceWith);
    }
    case "array": {
      return evaluatedArgs;
    }
    default:
      return "";
  }
}

export function parseBase64Blocks(templateStr: string): string {
  if (!templateStr || (!templateStr.includes("#base64") && !templateStr.includes("#base64Decode"))) return templateStr;

  let result = templateStr.replace(/\{\{#base64\}\}([\s\S]*?)\{\{\/base64\}\}/g, (_, content) => {
    return Buffer.from(content.trim()).toString("base64");
  });

  result = result.replace(/\{\{#base64Decode\}\}([\s\S]*?)\{\{\/base64Decode\}\}/g, (_, content) => {
    try {
      return Buffer.from(content.trim(), "base64").toString("utf-8");
    } catch {
      return content;
    }
  });

  return result;
}

export function parseDurationObject(durationStrOrObj: any): Record<string, number> {
  if (typeof durationStrOrObj === "object" && durationStrOrObj !== null) {
    return durationStrOrObj;
  }
  if (!durationStrOrObj || typeof durationStrOrObj !== "string") return {};

  const str = durationStrOrObj.trim();
  let jsonLike = str;
  if (str.startsWith("{") && str.endsWith("}")) {
    jsonLike = str.replace(/([a-zA-Z0-9_]+):/g, '"$1":').replace(/'/g, '"');
  } else {
    const pairs = str.split(/\s+/);
    const obj: Record<string, number> = {};
    for (const pair of pairs) {
      const [k, v] = pair.split("=");
      if (k && v) obj[k] = Number(v);
    }
    return obj;
  }

  try {
    return JSON.parse(jsonLike);
  } catch {
    return {};
  }
}

export function applyDateOffset(baseDate: Date, duration: Record<string, number>): Date {
  const d = new Date(baseDate.getTime());
  for (const [unit, valRaw] of Object.entries(duration)) {
    const val = Number(valRaw);
    if (isNaN(val)) continue;
    const u = unit.toLowerCase().replace(/s$/, "");
    switch (u) {
      case "millisecond":
      case "ms":
        d.setMilliseconds(d.getMilliseconds() + val);
        break;
      case "second":
      case "sec":
        d.setSeconds(d.getSeconds() + val);
        break;
      case "minute":
      case "min":
        d.setMinutes(d.getMinutes() + val);
        break;
      case "hour":
      case "hr":
        d.setHours(d.getHours() + val);
        break;
      case "day":
        d.setDate(d.getDate() + val);
        break;
      case "week":
        d.setDate(d.getDate() + val * 7);
        break;
      case "month":
        d.setMonth(d.getMonth() + val);
        break;
      case "year":
      case "yr":
        d.setFullYear(d.getFullYear() + val);
        break;
    }
  }
  return d;
}

export function parseFlexibleDate(input: any): Date {
  if (input instanceof Date) return input;
  if (!input) return new Date();

  const num = Number(input);
  if (!isNaN(num)) {
    return num > 10000000000 ? new Date(num) : new Date(num * 1000);
  }

  const d = new Date(String(input));
  return isNaN(d.getTime()) ? new Date() : d;
}

export function evaluateDateAdd(inputDateRaw: any, durationRaw: any, formatSpec?: string, context?: RequestContext): string {
  const inputVal = evaluateSubExpression(String(inputDateRaw || ""), context);
  const baseDate = parseFlexibleDate(inputVal);
  const durationVal = evaluateSubExpression(String(durationRaw || ""), context);
  const durationObj = parseDurationObject(durationVal);
  const resultDate = applyDateOffset(baseDate, durationObj);
  const cleanFormat = formatSpec ? formatSpec.replace(/^['"]|['"]$/g, "") : "iso";
  return formatFakerDate(resultDate, cleanFormat);
}

export function evaluateDateDiff(startDateRaw: any, endDateRaw: any, unitRaw?: string, context?: RequestContext): string {
  const startVal = evaluateSubExpression(String(startDateRaw || ""), context);
  const endVal = evaluateSubExpression(String(endDateRaw || ""), context);
  const startDate = parseFlexibleDate(startVal);
  const endDate = parseFlexibleDate(endVal);

  const diffMs = endDate.getTime() - startDate.getTime();
  const unit = (unitRaw || "days").toLowerCase().replace(/s$/, "");

  switch (unit) {
    case "millisecond":
    case "ms":
      return String(diffMs);
    case "second":
    case "sec":
      return String(Math.floor(diffMs / 1000));
    case "minute":
    case "min":
      return String(Math.floor(diffMs / (1000 * 60)));
    case "hour":
    case "hr":
      return String(Math.floor(diffMs / (1000 * 60 * 60)));
    case "day":
      return String(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    case "week":
      return String(Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)));
    case "month":
      return String(Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375)));
    case "year":
    case "yr":
      return String(Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25)));
    default:
      return String(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }
}

export function evaluateArrayOperator(op: string, rawArgs: string[], context?: RequestContext): any {
  const opLower = op.toLowerCase();

  switch (opLower) {
    case "sort": {
      if (rawArgs.length === 0) return [];
      let listVal = evaluateSubExpression(rawArgs[0], context);
      if (typeof listVal === "string") {
        try {
          const parsed = JSON.parse(listVal);
          if (Array.isArray(parsed)) listVal = parsed;
        } catch {
          // Keep string if not JSON
        }
      }

      if (!Array.isArray(listVal)) return listVal;

      let sortKey: string | undefined = undefined;
      let order: "asc" | "desc" = "asc";

      if (rawArgs.length >= 3) {
        sortKey = evaluateSubExpression(rawArgs[1], context);
        const orderVal = String(evaluateSubExpression(rawArgs[2], context)).toLowerCase();
        if (orderVal === "desc") order = "desc";
      } else if (rawArgs.length === 2) {
        const arg2Val = String(evaluateSubExpression(rawArgs[1], context)).toLowerCase();
        if (arg2Val === "asc" || arg2Val === "desc") {
          order = arg2Val as any;
        } else {
          sortKey = arg2Val;
        }
      }

      const arrCopy = [...listVal];
      arrCopy.sort((a, b) => {
        if (a === null || a === undefined) return 1;
        if (b === null || b === undefined) return -1;

        let valA = sortKey ? getNestedValueByDotNotation(a, sortKey) ?? a[sortKey] : a;
        let valB = sortKey ? getNestedValueByDotNotation(b, sortKey) ?? b[sortKey] : b;

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB) && typeof valA !== "boolean" && typeof valB !== "boolean") {
          return order === "asc" ? numA - numB : numB - numA;
        }

        const strA = String(valA);
        const strB = String(valB);
        return order === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });

      return JSON.stringify(arrCopy);
    }

    case "reverse": {
      if (rawArgs.length === 0) return [];
      let listVal = evaluateSubExpression(rawArgs[0], context);
      if (typeof listVal === "string") {
        try {
          const parsed = JSON.parse(listVal);
          if (Array.isArray(parsed)) listVal = parsed;
        } catch {
          // Keep as string
        }
      }

      if (!Array.isArray(listVal)) return listVal;
      const reversed = [...listVal].reverse();
      return JSON.stringify(reversed);
    }

    case "oneof": {
      if (rawArgs.length === 0) return "";
      let candidateList: any[] = [];
      if (rawArgs.length === 1) {
        const singleVal = evaluateSubExpression(rawArgs[0], context);
        if (Array.isArray(singleVal)) {
          candidateList = singleVal;
        } else if (typeof singleVal === "string") {
          try {
            const parsed = JSON.parse(singleVal);
            candidateList = Array.isArray(parsed) ? parsed : [singleVal];
          } catch {
            candidateList = [singleVal];
          }
        } else {
          candidateList = [singleVal];
        }
      } else {
        candidateList = rawArgs.map((a) => evaluateSubExpression(a, context));
      }

      if (candidateList.length === 0) return "";
      const picked = candidateList[Math.floor(Math.random() * candidateList.length)];
      return typeof picked === "object" ? JSON.stringify(picked) : String(picked);
    }

    case "someof": {
      if (rawArgs.length === 0) return "";
      let listVal = evaluateSubExpression(rawArgs[0], context);
      if (typeof listVal === "string") {
        try {
          const parsed = JSON.parse(listVal);
          if (Array.isArray(parsed)) listVal = parsed;
        } catch {
          listVal = [listVal];
        }
      }

      if (!Array.isArray(listVal)) listVal = [listVal];

      const minItems = rawArgs[1] !== undefined ? Number(evaluateSubExpression(rawArgs[1], context)) : 0;
      const maxItems = rawArgs[2] !== undefined ? Number(evaluateSubExpression(rawArgs[2], context)) : listVal.length;
      const stringify = rawArgs[3] !== undefined ? String(evaluateSubExpression(rawArgs[3], context)).toLowerCase() === "true" : false;

      const min = Math.max(0, Math.min(minItems, listVal.length));
      const max = Math.max(min, Math.min(maxItems, listVal.length));
      const count = Math.floor(Math.random() * (max - min + 1)) + min;

      const shuffled = [...listVal].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count);

      if (stringify) {
        return JSON.stringify(selected);
      }
      return selected.map(String).join(",");
    }

    default:
      return "";
  }
}

export function evaluateComparisonOperator(op: string, rawArgs: string[], context?: RequestContext): boolean {
  if (rawArgs.length < 2) return false;
  const left = evaluateSubExpression(rawArgs[0], context);
  const right = evaluateSubExpression(rawArgs[1], context);

  const numL = Number(left);
  const numR = Number(right);

  const isBothNumeric =
    !isNaN(numL) &&
    !isNaN(numR) &&
    typeof left !== "boolean" &&
    typeof right !== "boolean" &&
    String(left).trim() !== "" &&
    String(right).trim() !== "";

  const opLower = op.toLowerCase();

  switch (opLower) {
    case "eq": {
      return String(left) === String(right);
    }
    case "gt": {
      return isBothNumeric ? numL > numR : String(left) > String(right);
    }
    case "lt": {
      return isBothNumeric ? numL < numR : String(left) < String(right);
    }
    case "lte": {
      return isBothNumeric ? numL <= numR : String(left) <= String(right);
    }
    case "gte": {
      return isBothNumeric ? numL >= numR : String(left) >= String(right);
    }
    default:
      return false;
  }
}

export function evaluateTypeChecker(op: string, rawArgs: string[], context?: RequestContext): boolean {
  if (rawArgs.length === 0) return false;
  const val = evaluateSubExpression(rawArgs[0], context);
  const opLower = op.toLowerCase();

  switch (opLower) {
    case "isnumber": {
      if (val === null || val === undefined || val === "") return false;
      const num = Number(val);
      return !isNaN(num);
    }
    case "isinteger": {
      if (val === null || val === undefined || val === "") return false;
      const num = Number(val);
      return !isNaN(num) && Number.isInteger(num);
    }
    case "isdate": {
      if (val === null || val === undefined || val === "") return false;
      const str = String(val).trim();
      if (!isNaN(Number(str))) return false;
      const d = new Date(str);
      return !isNaN(d.getTime());
    }
    default:
      return false;
  }
}

export function evaluateJsonParse(jsonStrRaw: any, fieldPathRaw?: string, context?: RequestContext): any {
  let jsonStr = evaluateSubExpression(String(jsonStrRaw || ""), context);
  if (typeof jsonStr === "string") {
    jsonStr = jsonStr.replace(/^['"]|['"]$/g, "");
    if (jsonStr.includes('\\"')) {
      jsonStr = jsonStr.replace(/\\"/g, '"');
    }
  }
  if (!jsonStr || typeof jsonStr !== "string") return jsonStr;

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr.trim());
  } catch {
    return jsonStr;
  }

  const fieldPath = fieldPathRaw ? evaluateSubExpression(fieldPathRaw, context) : undefined;
  if (!fieldPath) {
    return parsed;
  }

  const cleanPath = String(fieldPath).replace(/^['"]|['"]$/g, "");
  const extracted = getNestedValueByDotNotation(parsed, cleanPath) ?? parsed[cleanPath];
  return extracted !== undefined ? extracted : "";
}

export function evaluateJwtHeader(tokenRaw: any, propertyKeyRaw?: string, context?: RequestContext): any {
  const tokenVal = evaluateSubExpression(String(tokenRaw || ""), context);
  if (!tokenVal || typeof tokenVal !== "string") return "";

  let cleanToken = tokenVal.trim();
  if (cleanToken.toLowerCase().startsWith("bearer ")) {
    cleanToken = cleanToken.slice(7).trim();
  }

  const parts = cleanToken.split(".");
  if (parts.length < 2) return "";

  try {
    const headerJson = Buffer.from(parts[0], "base64").toString("utf-8");
    const parsed = JSON.parse(headerJson);

    const propKey = propertyKeyRaw ? evaluateSubExpression(propertyKeyRaw, context) : undefined;
    if (propKey) {
      const cleanKey = String(propKey).replace(/^['"]|['"]$/g, "");
      return parsed[cleanKey] !== undefined ? parsed[cleanKey] : "";
    }
    return parsed;
  } catch {
    return "";
  }
}

export function evaluateJwtPayload(tokenRaw: any, claimKeyRaw?: string, context?: RequestContext): any {
  const tokenVal = evaluateSubExpression(String(tokenRaw || ""), context);
  if (!tokenVal || typeof tokenVal !== "string") return "";

  let cleanToken = tokenVal.trim();
  if (cleanToken.toLowerCase().startsWith("bearer ")) {
    cleanToken = cleanToken.slice(7).trim();
  }

  const parts = cleanToken.split(".");
  if (parts.length < 2) return "";

  try {
    const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
    const parsed = JSON.parse(payloadJson);

    const claimKey = claimKeyRaw ? evaluateSubExpression(claimKeyRaw, context) : undefined;
    if (claimKey) {
      const cleanKey = String(claimKey).replace(/^['"]|['"]$/g, "");
      const val = getNestedValueByDotNotation(parsed, cleanKey) ?? parsed[cleanKey];
      return val !== undefined ? val : "";
    }
    return parsed;
  } catch {
    return "";
  }
}

/**
 * Evaluates sub-expressions like (queryParam 'id'), (body 'status'), (eq 'paid' (body 'status')), or string literals.
 */
export function evaluateSubExpression(expr: string, context?: RequestContext): any {
  if (!expr) return "";
  const trimmed = expr.trim();
  const unwrap = trimmed.startsWith("(") && trimmed.endsWith(")") ? trimmed.slice(1, -1).trim() : trimmed;

  if ((unwrap.startsWith("'") && unwrap.endsWith("'")) || (unwrap.startsWith('"') && unwrap.endsWith('"'))) {
    return unwrap.slice(1, -1);
  }

  if (!isNaN(Number(unwrap))) {
    return Number(unwrap);
  }

  if (unwrap === "true") return true;
  if (unwrap === "false") return false;

  const jsonParseMatch = unwrap.match(/^jsonParse\s+(.*)$/i);
  if (jsonParseMatch) {
    const rest = jsonParseMatch[1];
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(rest)) !== null) {
      argsTokens.push(tMatch[1]);
    }
    const res = evaluateJsonParse(argsTokens[0], argsTokens[1], context);
    return typeof res === "object" ? JSON.stringify(res) : res;
  }

  const jwtHeaderMatch = unwrap.match(/^jwtHeader\s+(.*)$/i);
  if (jwtHeaderMatch) {
    const rest = jwtHeaderMatch[1];
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(rest)) !== null) {
      argsTokens.push(tMatch[1]);
    }
    const res = evaluateJwtHeader(argsTokens[0], argsTokens[1], context);
    return typeof res === "object" ? JSON.stringify(res) : res;
  }

  const jwtPayloadMatch = unwrap.match(/^jwtPayload\s+(.*)$/i);
  if (jwtPayloadMatch) {
    const rest = jwtPayloadMatch[1];
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(rest)) !== null) {
      argsTokens.push(tMatch[1]);
    }
    const res = evaluateJwtPayload(argsTokens[0], argsTokens[1], context);
    return typeof res === "object" ? JSON.stringify(res) : res;
  }

  const compMatch = unwrap.match(/^(eq|gt|lt|lte|gte)\s+(.*)$/i);
  if (compMatch) {
    const op = compMatch[1];
    const restArgsStr = compMatch[2];
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(restArgsStr)) !== null) {
      argsTokens.push(tMatch[1]);
    }
    return evaluateComparisonOperator(op, argsTokens, context);
  }

  const typeMatch = unwrap.match(/^(isNumber|isInteger|isDate)\s+(.*)$/i);
  if (typeMatch) {
    const op = typeMatch[1];
    const restArgsStr = typeMatch[2];
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(restArgsStr)) !== null) {
      argsTokens.push(tMatch[1]);
    }
    return evaluateTypeChecker(op, argsTokens, context);
  }

  const arrOpMatch = unwrap.match(/^(sort|reverse|oneOf|someOf)\s+(.*)$/i);
  if (arrOpMatch) {
    const op = arrOpMatch[1];
    const restArgsStr = arrOpMatch[2];
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(restArgsStr)) !== null) {
      argsTokens.push(tMatch[1]);
    }
    const res = evaluateArrayOperator(op, argsTokens, context);
    return typeof res === "object" ? JSON.stringify(res) : res;
  }

  const dateAddMatch = unwrap.match(/^dateAdd\s+(.*)$/i);
  if (dateAddMatch) {
    const rest = dateAddMatch[1];
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(rest)) !== null) {
      argsTokens.push(tMatch[1]);
    }
    return evaluateDateAdd(argsTokens[0], argsTokens[1], argsTokens[2], context);
  }

  const dateDiffMatch = unwrap.match(/^dateDiff\s+(.*)$/i);
  if (dateDiffMatch) {
    const rest = dateDiffMatch[1];
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(rest)) !== null) {
      argsTokens.push(tMatch[1]);
    }
    return evaluateDateDiff(argsTokens[0], argsTokens[1], argsTokens[2], context);
  }

  const dateParseMatch = unwrap.match(/^dateParse\s+(.*)$/i);
  if (dateParseMatch) {
    const rest = dateParseMatch[1];
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(rest)) !== null) {
      argsTokens.push(tMatch[1]);
    }
    return parseFlexibleDate(evaluateSubExpression(argsTokens[0], context)).toISOString();
  }

  const objectMatch = unwrap.match(/^object\s+(.*)$/i);
  if (objectMatch) {
    const rest = objectMatch[1];
    const pairs = rest.split(/\s+/);
    const obj: Record<string, any> = {};
    for (const pair of pairs) {
      const [k, v] = pair.split("=");
      if (k && v) {
        const cleanV = v.replace(/^['"]|['"]$/g, "");
        obj[k] = !isNaN(Number(cleanV)) ? Number(cleanV) : cleanV;
      }
    }
    return JSON.stringify(obj);
  }

  const strMatch = unwrap.match(/^(lowercase|uppercase|trim|slugify|stripTags|urlEncode|urlDecode|base64|base64Decode|padStart|padEnd|split|concat|contains|replace|array)\s+(.*)$/i);
  if (strMatch) {
    const op = strMatch[1];
    const restArgsStr = strMatch[2];
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(restArgsStr)) !== null) {
      argsTokens.push(tMatch[1]);
    }
    return evaluateStringOperator(op, argsTokens, context);
  }

  const arithMatch = unwrap.match(/^(add|subtract|multiply|divide|modulo|floor|ceil|round|toFixed)\s+(.*)$/i);
  if (arithMatch) {
    const op = arithMatch[1];
    const restArgsStr = arithMatch[2];
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(restArgsStr)) !== null) {
      argsTokens.push(tMatch[1]);
    }
    const res = evaluateArithmeticOperator(op, argsTokens, context);
    const n = Number(res);
    return isNaN(n) ? res : n;
  }

  const eqMatch = unwrap.match(/^eq\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\S+)\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\S+)$/i);
  if (eqMatch) {
    const left = evaluateSubExpression(eqMatch[1], context);
    const right = evaluateSubExpression(eqMatch[2], context);
    return String(left) === String(right);
  }

  const helperMatch = unwrap.match(/^(body|queryParam|header|cookie|pathParam)\s+['"]([a-zA-Z0-9_.-]+)['"](?:\s+['"]([^'"]*)['"])?$/i);
  if (helperMatch) {
    const helperName = helperMatch[1].toLowerCase();
    const key = helperMatch[2];
    const defaultVal = helperMatch[3];
    if (context) {
      if (helperName === "body" && context.body) {
        return getNestedValueByDotNotation(context.body, key) ?? context.body[key] ?? defaultVal;
      } else if (helperName === "queryparam" && context.query) {
        return getNestedValueByDotNotation(context.query, key) ?? context.query[key] ?? defaultVal;
      } else if (helperName === "header" && context.headers) {
        const found = Object.keys(context.headers).find((k) => k.toLowerCase() === key.toLowerCase());
        return found ? context.headers[found] : defaultVal;
      } else if (helperName === "cookie" && context.headers) {
        const cookieHeader = context.headers["cookie"] || context.headers["Cookie"];
        const cookies = parseCookies(cookieHeader);
        return cookies[key] ?? defaultVal;
      } else if (helperName === "pathparam" && context.params) {
        return context.params[key] ?? defaultVal;
      }
    }
    return defaultVal ?? "";
  }

  const listSubMatch = unwrap.match(/^list\s+['"]([a-zA-Z0-9_.-]+)['"]\s+['"]([a-zA-Z0-9_.-]+)['"](?:\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\S+))?(?:\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\S+))?/i);
  if (listSubMatch) {
    const res = evaluateListHelper(listSubMatch[1], listSubMatch[2], listSubMatch[3], listSubMatch[4], context);
    try { return JSON.parse(res); } catch { return res; }
  }

  const counterSubMatch = unwrap.match(/^step-counter\s+['"]([a-zA-Z0-9_.-]+)['"]\s+['"]([a-zA-Z0-9_.-]+)['"](?:\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\S+))?/i);
  if (counterSubMatch) {
    return evaluateStepCounter(counterSubMatch[1], counterSubMatch[2], counterSubMatch[3], context);
  }

  const dataSubMatch = unwrap.match(/^data-store\s+['"]([a-zA-Z0-9_.-]+)['"]\s+['"]([a-zA-Z0-9_.-]+)['"](?:\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\S+))?/i);
  if (dataSubMatch) {
    return evaluateDataStore(dataSubMatch[1], dataSubMatch[2], dataSubMatch[3], context);
  }

  const fakerSubMatch = unwrap.match(/^faker\s+['"]([a-zA-Z0-9_.-]+)['"](?:\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"))?(?:\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"))?/i);
  if (fakerSubMatch) {
    const arg2 = fakerSubMatch[2] ? fakerSubMatch[2].slice(1, -1) : undefined;
    const arg3 = fakerSubMatch[3] ? fakerSubMatch[3].slice(1, -1) : undefined;
    return evaluateFakerHelper(fakerSubMatch[1], arg2, arg3);
  }

  if (unwrap.includes(".")) {
    const parts = unwrap.split(".");
    const scope = parts[0];
    const key = parts.slice(1).join(".");
    if (context && (scope === "body" || scope === "query" || scope === "headers" || scope === "params")) {
      const scopeData = (context as any)[scope];
      if (scopeData) return getNestedValueByDotNotation(scopeData, key) ?? scopeData[key];
    }
  }

  return unwrap;
}

/**
 * Handles {{#switch expr}} {{#case 'val'}}..{{/case}} {{#default}}..{{/default}} {{/switch}}
 */
export function parseSwitchBlocks(templateStr: string, context?: RequestContext): string {
  if (!templateStr || !templateStr.includes("#switch")) return templateStr;

  const switchRegex = /\{\{#switch\s+(.*?)\}\}([\s\S]*?)\{\{\/switch\}\}/g;

  return templateStr.replace(switchRegex, (_, exprRaw, innerContent) => {
    const targetVal = evaluateSubExpression(exprRaw, context);
    const targetValStr = String(targetVal !== undefined && targetVal !== null ? targetVal : "").trim();

    const caseRegex = /\{\{#case\s+['"]([^'"]+)['"]\}\}([\s\S]*?)\{\{\/case\}\}/g;
    let match;
    let matchedContent: string | null = null;

    while ((match = caseRegex.exec(innerContent)) !== null) {
      const caseVal = match[1].trim();
      if (caseVal === targetValStr) {
        matchedContent = match[2];
        break;
      }
    }

    if (matchedContent !== null) {
      return matchedContent;
    }

    const defaultMatch = innerContent.match(/\{\{#default\}\}([\s\S]*?)\{\{\/default\}\}/);
    if (defaultMatch && defaultMatch[1]) {
      return defaultMatch[1];
    }

    return "";
  });
}

/**
 * Handles {{#if expr}}..{{else}}..{{/if}} and {{#unless expr}}..{{/unless}}
 */
export function parseIfElseBlocks(templateStr: string, context?: RequestContext): string {
  if (!templateStr || (!templateStr.includes("#if") && !templateStr.includes("#unless"))) return templateStr;

  let result = templateStr.replace(/\{\{#if\s+(.*?)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (_, exprRaw, ifContent, elseContent) => {
    const val = evaluateSubExpression(exprRaw, context);
    const isTruthy = !!val && val !== "false" && val !== "0" && val !== 0 && (!Array.isArray(val) || val.length > 0);
    if (isTruthy) {
      return ifContent;
    } else {
      return elseContent || "";
    }
  });

  result = result.replace(/\{\{#unless\s+(.*?)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (_, exprRaw, unlessContent) => {
    const val = evaluateSubExpression(exprRaw, context);
    const isTruthy = !!val && val !== "false" && val !== "0" && val !== 0 && (!Array.isArray(val) || val.length > 0);
    if (!isTruthy) {
      return unlessContent;
    } else {
      return "";
    }
  });

  return result;
}

/**
 * Handles {{#repeat count [maxCount]}}..{{/repeat}} with intelligent JSON comma insertion & @index, @total, @first, @last
 */
export function parseRepeatBlocks(templateStr: string, context?: RequestContext): string {
  if (!templateStr || !templateStr.includes("#repeat")) return templateStr;

  const repeatRegex = /\{\{#repeat\s+(\d+)(?:\s+(\d+))?(?:\s+comma=(true|false))?\s*\}\}([\s\S]*?)\{\{\/repeat\}\}/g;

  return templateStr.replace(repeatRegex, (_, arg1Str, arg2Str, commaArg, bodyContent) => {
    const count1 = Number(arg1Str);
    const count2 = arg2Str ? Number(arg2Str) : undefined;
    const addComma = commaArg !== "false";

    let total = count1;
    if (count2 !== undefined) {
      const min = Math.min(count1, count2);
      const max = Math.max(count1, count2);
      total = Math.floor(Math.random() * (max - min + 1)) + min;
    }

    total = Math.min(total, 1000);

    const iterations: string[] = [];
    for (let i = 0; i < total; i++) {
      const isFirst = i === 0;
      const isLast = i === total - 1;

      let itemText = bodyContent
        .replace(/\{\{@index\}\}/g, String(i))
        .replace(/\{\{@total\}\}/g, String(total))
        .replace(/\{\{@first\}\}/g, String(isFirst))
        .replace(/\{\{@last\}\}/g, String(isLast));

      if (addComma && !isLast) {
        const trimmed = itemText.trimEnd();
        if (!trimmed.endsWith(",")) {
          itemText = trimmed + ",";
        }
      }

      iterations.push(itemText);
    }

    return iterations.join("\n");
  });
}

/**
 * Handles {{#each list}}..{{/each}} loop over arrays with @index, @first, @last, and this
 */
export function parseEachBlocks(templateStr: string, context?: RequestContext): string {
  if (!templateStr || !templateStr.includes("#each")) return templateStr;

  const eachRegex = /\{\{#each\s+(.*?)\}\}([\s\S]*?)\{\{\/each\}\}/g;

  return templateStr.replace(eachRegex, (_, listExpr, bodyContent) => {
    let list: any[] = [];
    const val = evaluateSubExpression(listExpr, context);
    if (Array.isArray(val)) {
      list = val;
    } else if (typeof val === "object" && val !== null) {
      list = Object.values(val);
    }

    if (list.length === 0) return "";

    const total = list.length;
    const iterations: string[] = [];

    for (let i = 0; i < total; i++) {
      const item = list[i];
      const isFirst = i === 0;
      const isLast = i === total - 1;

      let itemText = bodyContent
        .replace(/\{\{@index\}\}/g, String(i))
        .replace(/\{\{@total\}\}/g, String(total))
        .replace(/\{\{@first\}\}/g, String(isFirst))
        .replace(/\{\{@last\}\}/g, String(isLast));

      itemText = itemText.replace(/\{\{\s*this\.([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match: string, prop: string) => {
        if (typeof item === "object" && item !== null) {
          const propVal = getNestedValueByDotNotation(item, prop) ?? item[prop];
          return propVal !== undefined && propVal !== null ? String(propVal) : "";
        }
        return "";
      });

      itemText = itemText.replace(/\{\{\s*this\s*\}\}/g, () => {
        return typeof item === "object" ? JSON.stringify(item) : String(item);
      });

      itemText = itemText.replace(/\{\{#unless\s+@last\}\}\s*,?\s*\{\{\/unless\}\}/g, () => {
        return isLast ? "" : ",";
      });

      iterations.push(itemText);
    }

    return iterations.join("\n");
  });
}

/**
 * Computes length for arrays, strings, numbers, and objects.
 */
export function computeLength(val: any): number {
  if (val === null || val === undefined) return 0;
  if (Array.isArray(val)) return val.length;
  if (typeof val === "string") return val.length;
  if (typeof val === "number") return String(val).length;
  if (typeof val === "object") return Object.keys(val).length;
  return 0;
}

// Persistent State Substrate
const globalCountersMap = new Map<string, number>();
const globalDataStoreMap = new Map<string, any>();
const globalListsMap = new Map<string, any[]>();

export function evaluateStepCounter(op: string, name: string, valueRaw?: any, context?: RequestContext): string {
  if (!name) return "";
  const key = name.trim();
  const val = valueRaw !== undefined ? Number(evaluateSubExpression(String(valueRaw), context)) : 1;
  const numVal = isNaN(val) ? 1 : val;

  switch (op.toLowerCase()) {
    case "inc": {
      const current = globalCountersMap.get(key) || 0;
      const updated = current + numVal;
      globalCountersMap.set(key, updated);
      return "";
    }
    case "get": {
      const current = globalCountersMap.get(key) || 0;
      return String(current);
    }
    case "set": {
      globalCountersMap.set(key, numVal);
      return String(numVal);
    }
    case "reset": {
      globalCountersMap.set(key, 0);
      return "0";
    }
    default:
      return "";
  }
}

export function evaluateDataStore(op: string, keyName: string, valueRaw?: any, context?: RequestContext): string {
  if (!keyName) return "";
  const key = keyName.trim();

  switch (op.toLowerCase()) {
    case "set": {
      const val = valueRaw !== undefined ? evaluateSubExpression(String(valueRaw), context) : undefined;
      globalDataStoreMap.set(key, val);
      return "";
    }
    case "get": {
      const stored = globalDataStoreMap.get(key);
      if (stored === undefined || stored === null) return "";
      return typeof stored === "object" ? JSON.stringify(stored) : String(stored);
    }
    default:
      return "";
  }
}

export function evaluateListHelper(op: string, listName: string, arg2Raw?: any, arg3Raw?: any, context?: RequestContext): string {
  if (!listName) return "";
  const name = listName.trim();
  let list = globalListsMap.get(name);
  if (!list) {
    list = [];
    globalListsMap.set(name, list);
  }

  const opLower = op.toLowerCase();
  const arg2 = arg2Raw !== undefined ? evaluateSubExpression(String(arg2Raw), context) : undefined;
  const arg3 = arg3Raw !== undefined ? evaluateSubExpression(String(arg3Raw), context) : undefined;

  switch (opLower) {
    case "push": {
      if (arg2 !== undefined) list.push(arg2);
      return "";
    }
    case "pop": {
      if (list.length === 0) return arg2 !== undefined ? String(arg2) : "";
      const popped = list.pop();
      return typeof popped === "object" ? JSON.stringify(popped) : String(popped);
    }
    case "shift": {
      if (list.length === 0) return arg2 !== undefined ? String(arg2) : "";
      const shifted = list.shift();
      return typeof shifted === "object" ? JSON.stringify(shifted) : String(shifted);
    }
    case "unshift": {
      if (arg2 !== undefined) list.unshift(arg2);
      return "";
    }
    case "push-unique": {
      if (arg2 !== undefined && !list.includes(arg2)) {
        list.push(arg2);
      }
      return "";
    }
    case "get": {
      if (arg2 === undefined) {
        return JSON.stringify(list);
      }
      const idx = Number(arg2);
      if (!isNaN(idx)) {
        const actualIdx = idx < 0 ? list.length + idx : idx;
        if (actualIdx >= 0 && actualIdx < list.length) {
          const item = list[actualIdx];
          return typeof item === "object" ? JSON.stringify(item) : String(item);
        }
        return arg3 !== undefined ? String(arg3) : "";
      }
      return JSON.stringify(list);
    }
    case "delete": {
      const idx = Number(arg2);
      if (!isNaN(idx)) {
        const actualIdx = idx < 0 ? list.length + idx : idx;
        if (actualIdx >= 0 && actualIdx < list.length) {
          list.splice(actualIdx, 1);
        }
      }
      return "";
    }
    case "reset": {
      globalListsMap.set(name, []);
      return "";
    }
    case "size": {
      return String(list.length);
    }
    case "contains": {
      return String(list.includes(arg2));
    }
    case "update": {
      const idx = Number(arg2);
      if (!isNaN(idx) && arg3 !== undefined) {
        const actualIdx = idx < 0 ? list.length + idx : idx;
        if (actualIdx >= 0 && actualIdx < list.length) {
          list[actualIdx] = arg3;
        }
      }
      return "";
    }
    case "find": {
      const foundIdx = list.findIndex((item) => String(item) === String(arg2));
      return String(foundIdx);
    }
    default:
      return "";
  }
}

/**
 * Interpolates request context variables (e.g. {{params.id}}, {{query.page}}, {{headers.authorization}})
 * and Faker mustache templates (e.g. {{person.firstName}}, {{internet.email}}).
 */
export function evaluateTemplateString(templateStr: string, context?: RequestContext, defaultLocale?: string): string {
  if (!templateStr || typeof templateStr !== "string") return templateStr;
  const resolvedLocale = context?.query?.locale || context?.headers?.["x-mockbit-locale"] || context?.headers?.["x-locale"] || defaultLocale;

  // Pre-process Control Flow Blocks & Base64 Blocks: #base64, #switch, #if, #repeat, #each
  let result = templateStr;
  result = parseBase64Blocks(result);
  result = parseSwitchBlocks(result, context);
  result = parseIfElseBlocks(result, context);
  result = parseRepeatBlocks(result, context);
  result = parseEachBlocks(result, context);

  // Interpolate string & array operators
  result = result.replace(/\{\{\s*(lowercase|uppercase|trim|slugify|stripTags|urlEncode|urlDecode|base64|base64Decode|padStart|padEnd|split|concat|contains|replace)\s+(.*?)\s*\}\}/gi, (_, op, restArgsStr) => {
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(restArgsStr)) !== null) {
      argsTokens.push(tMatch[1]);
    }
    const res = evaluateStringOperator(op, argsTokens, context);
    return typeof res === "object" ? JSON.stringify(res) : String(res);
  });

  // Interpolate array operators: {{sort ...}}, {{{sort ...}}}, {{reverse ...}}, {{oneOf ...}}, {{someOf ...}}
  result = result.replace(/\{\{\{?\s*(sort|reverse|oneOf|someOf)\s+(.*?)\s*\}\}\}?/gi, (_, op, restArgsStr) => {
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(restArgsStr)) !== null) {
      argsTokens.push(tMatch[1]);
    }
    const res = evaluateArrayOperator(op, argsTokens, context);
    return typeof res === "object" ? JSON.stringify(res) : String(res);
  });

  // Interpolate standalone type checkers & comparison operators: {{isNumber ...}}, {{isInteger ...}}, {{isDate ...}}, {{gt ...}}, {{lt ...}}, {{lte ...}}, {{gte ...}}, {{eq ...}}
  result = result.replace(/\{\{\s*(isNumber|isInteger|isDate|gt|lt|lte|gte)\s+(.*?)\s*\}\}/gi, (_, op, restArgsStr) => {
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(restArgsStr)) !== null) {
      argsTokens.push(tMatch[1]);
    }
    if (["isnumber", "isinteger", "isdate"].includes(op.toLowerCase())) {
      return String(evaluateTypeChecker(op, argsTokens, context));
    }
    return String(evaluateComparisonOperator(op, argsTokens, context));
  });

  // Interpolate {{len expression}} helper
  result = result.replace(/\{\{\s*len\s+(.*?)\s*\}\}/g, (_, expr) => {
    const val = evaluateSubExpression(expr, context);
    return String(computeLength(val));
  });

  // Interpolate arithmetic operators: {{add ...}}, {{subtract ...}}, {{multiply ...}}, {{divide ...}}, {{modulo ...}}, {{floor ...}}, {{ceil ...}}, {{round ...}}, {{toFixed ...}}
  result = result.replace(/\{\{\s*(add|subtract|multiply|divide|modulo|floor|ceil|round|toFixed)\s+(.*?)\s*\}\}/gi, (_, op, restArgsStr) => {
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(restArgsStr)) !== null) {
      argsTokens.push(tMatch[1]);
    }
    return evaluateArithmeticOperator(op, argsTokens, context);
  });

  // Interpolate date operators: {{dateAdd ...}}, {{dateDiff ...}}
  result = result.replace(/\{\{\s*dateAdd\s+(.*?)\s*\}\}/gi, (_, restArgsStr) => {
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(restArgsStr)) !== null) {
      argsTokens.push(tMatch[1]);
    }
    return evaluateDateAdd(argsTokens[0], argsTokens[1], argsTokens[2], context);
  });

  result = result.replace(/\{\{\s*dateDiff\s+(.*?)\s*\}\}/gi, (_, restArgsStr) => {
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(restArgsStr)) !== null) {
      argsTokens.push(tMatch[1]);
    }
    return evaluateDateDiff(argsTokens[0], argsTokens[1], argsTokens[2], context);
  });

  // Interpolate {{step-counter 'op' 'name' [val]}}
  result = result.replace(/\{\{\s*step-counter\s+['"]([a-zA-Z0-9_.-]+)['"]\s+['"]([a-zA-Z0-9_.-]+)['"](?:\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\S+))?\s*\}\}/g, (_, op, name, valRaw) => {
    return evaluateStepCounter(op, name, valRaw, context);
  });

  // Interpolate {{data-store 'op' 'key' [val]}}
  result = result.replace(/\{\{\s*data-store\s+['"]([a-zA-Z0-9_.-]+)['"]\s+['"]([a-zA-Z0-9_.-]+)['"](?:\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\S+))?\s*\}\}/g, (_, op, key, valRaw) => {
    return evaluateDataStore(op, key, valRaw, context);
  });

  // Interpolate {{list 'op' 'name' [arg2] [arg3]}}
  result = result.replace(/\{\{\s*list\s+['"]([a-zA-Z0-9_.-]+)['"]\s+['"]([a-zA-Z0-9_.-]+)['"](?:\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\S+))?(?:\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\S+))?\s*\}\}/g, (_, op, name, arg2Raw, arg3Raw) => {
    return evaluateListHelper(op, name, arg2Raw, arg3Raw, context);
  });

  // Interpolate {{jsonParse ...}}, {{jwtHeader ...}}, {{jwtPayload ...}}
  result = result.replace(/\{\{\{?\s*(jsonParse|jwtHeader|jwtPayload)\s+(.*?)\s*\}\}\}?/gi, (_, op, restArgsStr) => {
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(restArgsStr)) !== null) {
      argsTokens.push(tMatch[1]);
    }

    const opLower = op.toLowerCase();
    let res: any;
    if (opLower === "jsonparse") {
      let arg1 = argsTokens[0];
      let arg2 = argsTokens[1];

      const match2 = restArgsStr.trim().match(/^(['"][\s\S]*?['"])\s+(['"][\s\S]*?['"])$/);
      if (match2) {
        arg1 = match2[1];
        arg2 = match2[2];
      }
      res = evaluateJsonParse(arg1, arg2, context);
    } else if (opLower === "jwtheader") {
      res = evaluateJwtHeader(argsTokens[0], argsTokens[1], context);
    } else if (opLower === "jwtpayload") {
      res = evaluateJwtPayload(argsTokens[0], argsTokens[1], context);
    }

    return typeof res === "object" ? JSON.stringify(res) : String(res);
  });

  // Interpolate {{{json expr [key]}}} raw JSON helper
  result = result.replace(/\{\{\{\s*json\s+(.*?)\s*\}\}\}/g, (_, exprStr) => {
    const argsTokens: string[] = [];
    const tokenRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+)/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(exprStr)) !== null) {
      argsTokens.push(tMatch[1]);
    }

    let val = evaluateSubExpression(argsTokens[0], context);
    if (argsTokens[1]) {
      const cleanKey = evaluateSubExpression(argsTokens[1], context);
      if (typeof val === "object" && val !== null) {
        val = getNestedValueByDotNotation(val, String(cleanKey)) ?? val[String(cleanKey)];
      }
    }
    return typeof val === "object" ? JSON.stringify(val) : String(val);
  });
  const resolveHelperValue = (
    helper: "body" | "queryParam" | "header" | "cookie",
    pathKey: string,
    defaultVal?: string
  ): string => {
    if (!context) return defaultVal !== undefined ? defaultVal : "";

    let rawVal: any = undefined;
    if (helper === "body") {
      if (context.body) {
        rawVal = getNestedValueByDotNotation(context.body, pathKey) ?? context.body[pathKey];
      }
    } else if (helper === "queryParam") {
      if (context.query) {
        rawVal = getNestedValueByDotNotation(context.query, pathKey) ?? context.query[pathKey];
      }
    } else if (helper === "header") {
      if (context.headers) {
        const lowerKey = pathKey.toLowerCase();
        const foundKey = Object.keys(context.headers).find((k) => k.toLowerCase() === lowerKey);
        rawVal = foundKey ? context.headers[foundKey] : undefined;
      }
    } else if (helper === "cookie") {
      const cookieHeader = context.headers
        ? context.headers["cookie"] || context.headers["Cookie"]
        : undefined;
      const cookieMap = parseCookies(cookieHeader);
      rawVal = cookieMap[pathKey];
    }

    if (rawVal !== undefined && rawVal !== null) {
      return typeof rawVal === "object" ? JSON.stringify(rawVal) : String(rawVal);
    }

    return defaultVal !== undefined ? defaultVal : "";
  };

  // 1a. Triple-stache unescaped helpers: {{{body 'path' 'default'}}}, {{{queryParam ...}}}, {{{header ...}}}, {{{cookie ...}}}
  result = result.replace(/\{\{\{\s*(body|queryParam|header|cookie)\s+['"]([a-zA-Z0-9_.-]+)['"](?:\s+['"]([^'"]*)['"])?\s*\}\}\}/g, (_, helper, key, defaultVal) => {
    return resolveHelperValue(helper, key, defaultVal);
  });

  // 1b. Double-stache HTML-escaped helpers: {{body 'path' 'default'}}, {{queryParam ...}}, {{header ...}}, {{cookie ...}}
  result = result.replace(/\{\{\s*(body|queryParam|header|cookie)\s+['"]([a-zA-Z0-9_.-]+)['"](?:\s+['"]([^'"]*)['"])?\s*\}\}/g, (_, helper, key, defaultVal) => {
    const raw = resolveHelperValue(helper, key, defaultVal);
    return escapeHtml(raw);
  });

  // 2. Interpolate builtin time helpers: {{timestamp}}, {{isoDate}}
  result = result
    .replace(/\{\{\s*timestamp\s*\}\}/g, () => String(Date.now()))
    .replace(/\{\{\s*isoDate\s*\}\}/g, () => new Date().toISOString());

  // 3. Interpolate {{pathParam 'group_name' 'default_val'}} or {{pathParam 'group_name'}}
  result = result.replace(/\{\{\s*pathParam\s+['"]([a-zA-Z0-9_.-]+)['"](?:\s+['"]([^'"]*)['"])?\s*\}\}/g, (_, key, defaultVal) => {
    if (context && context.params && context.params[key] !== undefined) {
      return String(context.params[key]);
    }
    return defaultVal !== undefined ? defaultVal : `[pathParam.${key}]`;
  });

  // 4. Interpolate request context variables: {{params.xyz}}, {{query.xyz}}, {{headers.xyz}}, {{body.xyz}}
  result = result.replace(/\{\{\s*(params|query|headers|body)\.([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, scope, key) => {
    if (context) {
      const scopeData = context[scope as keyof RequestContext];
      if (scopeData && scopeData[key] !== undefined) {
        return typeof scopeData[key] === "object" ? JSON.stringify(scopeData[key]) : String(scopeData[key]);
      }
    }
    return `[${scope}.${key}]`;
  });

  // 5. Interpolate Beeceptor callout template helpers: {{oReqBody 'field'}}, {{oResBody 'field'}}, {{oReqQueryParam 'param'}}
  result = result.replace(/\{\{\s*oReqBody\s+['"]([a-zA-Z0-9_.-]+)['"]\s*\}\}/g, (_, field) => {
    if (context && context.body) {
      const val = getNestedValueByDotNotation(context.body, field) ?? context.body[field];
      if (val !== undefined && val !== null) {
        return typeof val === "object" ? JSON.stringify(val) : String(val);
      }
    }
    return "";
  });

  result = result.replace(/\{\{\s*oResBody\s+['"]([a-zA-Z0-9_.-]+)['"]\s*\}\}/g, (_, field) => {
    if (context && (context as any).resBody) {
      const resBody = (context as any).resBody;
      const val = getNestedValueByDotNotation(resBody, field) ?? resBody[field];
      if (val !== undefined && val !== null) {
        return typeof val === "object" ? JSON.stringify(val) : String(val);
      }
    }
    return "";
  });

  result = result.replace(/\{\{\s*oReqQueryParam\s+['"]([a-zA-Z0-9_.-]+)['"]\s*\}\}/g, (_, param) => {
    if (context && context.query && context.query[param] !== undefined) {
      return String(context.query[param]);
    }
    return "";
  });

  // 5b. Interpolate {{now ...}} with optional duration offset & format
  result = result.replace(/\{\{\s*now(?:\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]+\)|\S+))?(?:\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\S+))?\s*\}\}/g, (_, arg1Raw, arg2Raw) => {
    let arg1 = arg1Raw ? evaluateSubExpression(arg1Raw, context) : undefined;
    let arg2 = arg2Raw ? evaluateSubExpression(arg2Raw, context) : undefined;

    if (typeof arg1 === "object") {
      arg1 = JSON.stringify(arg1);
    }
    if (typeof arg2 === "object") {
      arg2 = JSON.stringify(arg2);
    }

    let baseDate = new Date();
    let formatSpec = "utc";

    if (arg1) {
      const str1 = String(arg1).trim();
      if (str1.startsWith("{") || str1.includes("=") || str1.includes(":")) {
        const duration = parseDurationObject(str1);
        baseDate = applyDateOffset(baseDate, duration);
        formatSpec = arg2 ? String(arg2).replace(/^['"]|['"]$/g, "") : "utc";
      } else {
        formatSpec = str1.replace(/^['"]|['"]$/g, "");
      }
    }

    return formatFakerDate(baseDate, formatSpec);
  });

  // 5c. Interpolate explicit {{faker 'namespace.method' 'arg2' 'arg3'}} or {{faker 'namespace.method'}}
  result = result.replace(/\{\{\s*faker\s+['"]([a-zA-Z0-9_.-]+)['"](?:\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"))?(?:\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"))?\s*\}\}/g, (_, key, arg2Raw, arg3Raw) => {
    const arg2 = arg2Raw ? arg2Raw.slice(1, -1) : undefined;
    const arg3 = arg3Raw ? arg3Raw.slice(1, -1) : undefined;
    return evaluateFakerHelper(key, arg2, arg3, resolvedLocale);
  });

  // 6. Interpolate Faker mustache expressions if any remain (e.g. {{person.firstName}})
  if (result.includes("{{")) {
    try {
      const targetFaker = getLocalizedFaker(resolvedLocale);
      result = targetFaker.helpers.fake(result);
    } catch {
      // Return unparsed template if invalid Faker helper
    }
  }

  return result;
}

/**
 * Extracts named capture groups from a RegEx path pattern string matching requestPath
 * (e.g. /companies/(?<company_id>[a-zA-Z0-9-]+) -> { company_id: 'be32a3a3-c2af' })
 */
export function extractPathNamedGroups(pathPattern: string, requestPath: string): Record<string, string> {
  const namedGroups: Record<string, string> = {};
  try {
    const regex = new RegExp(pathPattern);
    const match = regex.exec(requestPath);
    if (match && match.groups) {
      Object.assign(namedGroups, match.groups);
    }
  } catch {
    // invalid regex pattern
  }
  return namedGroups;
}

/**
 * Parses Express / Django style colon path templates (e.g. /orders/:orderId/items/:itemIndex)
 * and extracts URL-decoded parameters matching requestPath (e.g. /orders/AB-9987/items/2 -> { orderId: 'AB-9987', itemIndex: '2' })
 */
export function parseColonPathTemplate(
  templatePattern: string,
  requestPath: string
): { matched: boolean; params: Record<string, string> } {
  const params: Record<string, string> = {};

  if (!templatePattern || typeof templatePattern !== "string") {
    return { matched: false, params };
  }

  const cleanTemplate = templatePattern.replace(/\/+$/, "");
  const cleanPath = requestPath.replace(/\/+$/, "");

  const paramNames: string[] = [];
  const regexPattern = cleanTemplate.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
    paramNames.push(name);
    return "([^/]+)";
  });

  try {
    const regex = new RegExp(`^${regexPattern}$`);
    const match = regex.exec(cleanPath);

    if (match) {
      paramNames.forEach((name, index) => {
        const rawValue = match[index + 1];
        params[name] = rawValue ? decodeURIComponent(rawValue) : "";
      });
      return { matched: true, params };
    }
  } catch {
    // Regex compile error
  }

  return { matched: false, params };
}

export function generateFieldValue(field: FieldDefinition, context?: RequestContext): any {
  // If custom template is provided, evaluate template
  if (field.type === "template" || (field.template && field.template.includes("{{"))) {
    return evaluateTemplateString(field.template || "{{lorem.sentence}}", context);
  }

  switch (field.type) {
    case "uuid":
      return faker.string.uuid();

    case "fullName":
      return faker.person.fullName();

    case "firstName":
      return faker.person.firstName();

    case "lastName":
      return faker.person.lastName();

    case "email":
      return faker.internet.email();

    case "phone":
      return faker.phone.number();

    case "avatar":
      return faker.image.avatar();

    case "city":
      return faker.location.city();

    case "country":
      return faker.location.country();

    case "address":
      return faker.location.streetAddress();

    case "zipCode":
      return faker.location.zipCode();

    case "company":
      return faker.company.name();

    case "jobTitle":
      return faker.person.jobTitle();

    case "date":
      return faker.date.past().toISOString();

    case "futureDate":
      return faker.date.future().toISOString();

    case "number": {
      const min = field.min ?? 1;
      const max = field.max ?? 1000;
      return faker.number.int({ min, max });
    }

    case "boolean":
      return faker.datatype.boolean();

    case "currency": {
      const amount = faker.finance.amount({ min: 10, max: 999, dec: 2 });
      return `$${amount}`;
    }

    case "enum": {
      const opts = field.options && field.options.length > 0 ? field.options : ["active", "pending", "archived"];
      return faker.helpers.arrayElement(opts);
    }

    case "lorem":
      return faker.lorem.sentence();

    case "url":
      return faker.internet.url();

    case "ip":
      return faker.internet.ip();

    case "mac":
      return faker.internet.mac();

    case "ssn":
      return `${faker.string.numeric(3)}-${faker.string.numeric(2)}-${faker.string.numeric(4)}`;

    case "bcrypt":
      return `$2a$12$${faker.string.alphanumeric(22)}${faker.string.alphanumeric(31)}`;

    case "object": {
      if (!field.fields || field.fields.length === 0) return {};
      const obj: Record<string, any> = {};
      for (const child of field.fields) {
        obj[child.name] = generateFieldValue(child, context);
      }
      return obj;
    }

    case "array": {
      const length = field.min ?? 3;
      const itemFields = field.fields ?? [];
      const arr: any[] = [];
      for (let i = 0; i < length; i++) {
        if (itemFields.length > 0) {
          const itemObj: Record<string, any> = {};
          for (const itemField of itemFields) {
            itemObj[itemField.name] = generateFieldValue(itemField, context);
          }
          arr.push(itemObj);
        } else {
          arr.push(faker.lorem.word());
        }
      }
      return arr;
    }

    default:
      return faker.lorem.word();
  }
}

/**
 * Infers a Faker field definition type from a key name or string value hint.
 */
export function inferFieldType(key: string, sampleValue?: any): FieldDefinition["type"] {
  const lowerKey = key.toLowerCase();

  // Explicit template string
  if (typeof sampleValue === "string" && sampleValue.includes("{{")) {
    return "template";
  }

  // 1. Explicit value types take precedence
  if (typeof sampleValue === "boolean" || lowerKey.startsWith("is_") || lowerKey.startsWith("has_")) {
    return "boolean";
  }

  // 2. Specific compound names
  if (lowerKey.includes("email")) return "email";
  if (lowerKey.includes("first_name") || lowerKey.includes("firstname")) return "firstName";
  if (lowerKey.includes("last_name") || lowerKey.includes("lastname")) return "lastName";
  if (lowerKey.includes("avatar") || lowerKey.includes("image") || lowerKey.includes("photo") || lowerKey.includes("picture")) return "avatar";
  if (lowerKey.includes("zip") || lowerKey.includes("postal")) return "zipCode";
  if (lowerKey.includes("address") || lowerKey.includes("street")) return "address";
  if (lowerKey.includes("city")) return "city";
  if (lowerKey.includes("country")) return "country";
  if (lowerKey.includes("company") || lowerKey.includes("org")) return "company";
  if (lowerKey.includes("job") || lowerKey.includes("title")) return "jobTitle";
  if (lowerKey.includes("url") || lowerKey.includes("link") || lowerKey.includes("website")) return "url";
  if (lowerKey.includes("ip_address") || lowerKey === "ip") return "ip";
  if (lowerKey.includes("phone") || lowerKey.includes("mobile")) return "phone";
  if (lowerKey.includes("price") || lowerKey.includes("amount") || lowerKey.includes("cost") || lowerKey.includes("fee")) return "currency";
  if (lowerKey.includes("status") || lowerKey.includes("state") || lowerKey.includes("role") || lowerKey.includes("type") || lowerKey.includes("category")) return "enum";

  // 3. Dates
  if (lowerKey.includes("date") || lowerKey.includes("created") || lowerKey.includes("updated") || lowerKey.endsWith("_at")) return "date";

  // 4. IDs (strict match to avoid false positives like "is_paid")
  if (lowerKey === "id" || lowerKey.endsWith("_id") || lowerKey.startsWith("id_")) return "uuid";

  // 5. Names
  if (lowerKey.includes("name") || lowerKey.includes("user") || lowerKey.includes("customer")) return "fullName";

  // 6. Data Types from sample value fallback
  if (typeof sampleValue === "number") return "number";
  if (Array.isArray(sampleValue)) return "array";
  if (sampleValue && typeof sampleValue === "object") return "object";

  return "lorem";
}

/**
 * Generates a complete mock response from a schema config or raw JSON template.
 */
export function generateMockResponse(
  schemaConfig: MockSchemaConfig,
  responseType: "object" | "array" = "object",
  arrayLength: number = 10,
  context?: RequestContext,
  seed?: number
): any {
  // If seed is provided, set deterministic seed
  const activeSeed = seed ?? schemaConfig?.seed;
  if (typeof activeSeed === "number" && !isNaN(activeSeed)) {
    faker.seed(activeSeed);
  }

  // Mode A: Structured fields definition
  if (Array.isArray(schemaConfig.fields) && schemaConfig.fields.length > 0) {
    const generateSingleObject = () => {
      const result: Record<string, any> = {};
      for (const field of schemaConfig.fields!) {
        result[field.name] = generateFieldValue(field, context);
      }
      return result;
    };

    if (responseType === "array") {
      const list: any[] = [];
      for (let i = 0; i < arrayLength; i++) {
        list.push(generateSingleObject());
      }
      return list;
    }

    return generateSingleObject();
  }

  // Mode B: Raw JSON sample provided — infer fields dynamically & evaluate string values
  if (typeof schemaConfig === "object" && schemaConfig !== null) {
    const template = Array.isArray(schemaConfig) ? schemaConfig[0] ?? {} : schemaConfig;
    const keys = Object.keys(template);

    if (keys.length > 0) {
      const generateFromTemplate = () => {
        const res: Record<string, any> = {};
        for (const key of keys) {
          const val = template[key];
          if (typeof val === "string" && val.includes("{{")) {
            res[key] = evaluateTemplateString(val, context);
          } else {
            const inferredType = inferFieldType(key, val);
            res[key] = generateFieldValue({ name: key, type: inferredType }, context);
          }
        }
        return res;
      };

      if (responseType === "array") {
        return Array.from({ length: arrayLength }, () => generateFromTemplate());
      }

      return generateFromTemplate();
    }
  }

  // Fallback: Default sample object
  const defaultFields: FieldDefinition[] = [
    { name: "id", type: "uuid" },
    { name: "name", type: "fullName" },
    { name: "email", type: "email" },
    { name: "status", type: "enum", options: ["active", "pending", "inactive"] },
    { name: "createdAt", type: "date" },
  ];

  const buildDefault = () => {
    const obj: Record<string, any> = {};
    for (const f of defaultFields) {
      obj[f.name] = generateFieldValue(f, context);
    }
    return obj;
  };

  if (responseType === "array") {
    return Array.from({ length: arrayLength }, () => buildDefault());
  }

  return buildDefault();
}
