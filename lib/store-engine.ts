import {
  EntityRelation,
  ScenarioPreset,
  StateSnapshot,
  TransactionLogEntry,
  RequestContext,
  generateMockResponse,
  getNestedValueByDotNotation,
} from "@/lib/mock-generator";

// ---------------------------------------------------------------------------
// In-Memory Core Stores (Global Singleton per process)
// ---------------------------------------------------------------------------
export interface LoggedRequest {
  id: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  response_status: number;
  response_body?: any;
  timestamp: string;
  latency_ms: number;
  ip?: string;
}

const statefulStore = new Map<string, Record<string, unknown>[]>();
const transactionLogs = new Map<string, TransactionLogEntry[]>();
const snapshotRegistry = new Map<string, StateSnapshot[]>();
const globalRequestLogs: LoggedRequest[] = [];

export function logRequest(req: LoggedRequest): void {
  globalRequestLogs.unshift(req);
  if (globalRequestLogs.length > 200) {
    globalRequestLogs.pop();
  }
}

export function getLoggedRequests(limit: number = 50): LoggedRequest[] {
  return globalRequestLogs.slice(0, limit);
}

export function clearRequestLogs(): void {
  globalRequestLogs.length = 0;
}

// ---------------------------------------------------------------------------
// Key Helpers
// ---------------------------------------------------------------------------
export function getStoreKey(user: string, endpointId: string, branch: string = "main"): string {
  const cleanBranch = branch.trim().toLowerCase() || "main";
  return `${user}:${cleanBranch}:${endpointId}`;
}

export function getLogKey(user: string, endpointId: string, branch: string = "main"): string {
  const cleanBranch = branch.trim().toLowerCase() || "main";
  return `${user}:${cleanBranch}:${endpointId}`;
}

// ---------------------------------------------------------------------------
// Store Retrieval & Seeding
// ---------------------------------------------------------------------------
export function getStoreData(storeKey: string): Record<string, unknown>[] | undefined {
  return statefulStore.get(storeKey);
}

export function setStoreData(storeKey: string, records: Record<string, unknown>[]): void {
  statefulStore.set(storeKey, records);
}

export function getOrSeedStore(
  storeKey: string,
  schema: unknown,
  responseType: "object" | "array",
  arrayLength: number,
  context?: RequestContext,
  seed?: number
): Record<string, unknown>[] {
  if (!statefulStore.has(storeKey)) {
    const seeded = generateMockResponse(schema as any, "array", Math.max(arrayLength, 3), context, seed) as Record<
      string,
      unknown
    >[];
    const initialRecords = Array.isArray(seeded) ? seeded : [seeded];
    statefulStore.set(storeKey, initialRecords);
  }
  return statefulStore.get(storeKey)!;
}

// ---------------------------------------------------------------------------
// Transaction Logs & Ledger History
// ---------------------------------------------------------------------------
export function recordTransaction(
  user: string,
  branch: string,
  endpointId: string,
  action: "POST" | "PUT" | "PATCH" | "DELETE" | "SYSTEM" | "REWIND",
  details: string,
  snapshot: Record<string, unknown>[],
  resourceId?: string
): TransactionLogEntry {
  const key = getLogKey(user, endpointId, branch);
  const logs = transactionLogs.get(key) || [];
  const version = logs.length + 1;

  const entry: TransactionLogEntry = {
    version,
    timestamp: new Date().toISOString(),
    user,
    branch,
    endpointId,
    method: action,
    resourceId,
    diff: details,
    snapshotState: JSON.parse(JSON.stringify(snapshot)),
  };

  logs.push(entry);
  transactionLogs.set(key, logs);
  return entry;
}

export function getTransactionLogs(user: string, endpointId: string, branch: string = "main"): TransactionLogEntry[] {
  const key = getLogKey(user, endpointId, branch);
  return transactionLogs.get(key) || [];
}

export const getTransactionLog = getTransactionLogs;

export function rewindToVersion(
  user: string,
  endpointId: string,
  branch: string,
  targetVersion: number
): { success: boolean; message: string } | Record<string, unknown>[] | null {
  const logs = getTransactionLogs(user, endpointId, branch);
  const targetEntry = logs.find((l) => l.version === targetVersion);

  if (!targetEntry) return null;

  const restoredRecords = JSON.parse(JSON.stringify(targetEntry.snapshotState));
  const storeKey = getStoreKey(user, endpointId, branch);
  setStoreData(storeKey, restoredRecords);

  recordTransaction(
    user,
    branch,
    endpointId,
    "REWIND",
    `Rewound state to version v${targetVersion}`,
    restoredRecords
  );

  return restoredRecords;
}

// ---------------------------------------------------------------------------
// Cascade Deletes Engine (Relational Foreign Key Integrity)
// ---------------------------------------------------------------------------
export function executeCascadeDelete(
  user: string,
  branch: string,
  targetEntitySlug: string,
  deletedId: string | number,
  relations: EntityRelation[] = [],
  allEndpoints: any[] = []
): { affectedEndpoints: string[]; deletedCount: number; cascadeCount: number } {
  let totalDeleted = 0;
  const affected: string[] = [];

  const dependentRelations = relations.filter(
    (r) =>
      r.onDelete === "cascade" ||
      r.onDelete === "setNull" ||
      (r as any).parentEntity?.toLowerCase() === targetEntitySlug.toLowerCase()
  );

  for (const rel of dependentRelations) {
    const childEntitySlug = rel.targetEndpoint || (rel as any).childEntity;
    if (!childEntitySlug) continue;

    const childStoreKey = getStoreKey(user, childEntitySlug, branch);
    const childRecords = getStoreData(childStoreKey);
    if (!childRecords || childRecords.length === 0) continue;

    const fkField = rel.foreignKey;
    const remainingChildren = childRecords.filter(
      (record) => String(record[fkField]) !== String(deletedId)
    );

    const numDeleted = childRecords.length - remainingChildren.length;
    if (numDeleted > 0) {
      setStoreData(childStoreKey, remainingChildren);
      totalDeleted += numDeleted;
      affected.push(childEntitySlug);

      recordTransaction(
        user,
        branch,
        childEntitySlug,
        "DELETE",
        `Cascade deleted ${numDeleted} record(s) referencing ${targetEntitySlug} ID ${deletedId}`,
        remainingChildren
      );
    }
  }

  return { affectedEndpoints: affected, deletedCount: totalDeleted, cascadeCount: totalDeleted };
}

// ---------------------------------------------------------------------------
// State Snapshots Engine
// ---------------------------------------------------------------------------
export function createSnapshot(
  user: string,
  branch: string,
  name: string,
  description?: string,
  activeEndpointSlugs: string[] = []
): StateSnapshot {
  const userSnaps = snapshotRegistry.get(user) || [];
  const snapshotData: Record<string, Record<string, unknown>[]> = {};

  activeEndpointSlugs.forEach((slug) => {
    const storeKey = getStoreKey(user, slug, branch);
    const data = getStoreData(storeKey) || [];
    snapshotData[slug] = JSON.parse(JSON.stringify(data));
  });

  const snapshot: StateSnapshot = {
    id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    branch,
    created_at: new Date().toISOString(),
    storeData: snapshotData,
  };

  userSnaps.push(snapshot);
  snapshotRegistry.set(user, userSnaps);
  return snapshot;
}

export function getSnapshots(user: string): StateSnapshot[] {
  return snapshotRegistry.get(user) || [];
}

export const listSnapshots = getSnapshots;

export function restoreSnapshot(user: string, branch: string, snapshotId: string): boolean {
  const userSnaps = snapshotRegistry.get(user) || [];
  const snap = userSnaps.find((s) => s.id === snapshotId);
  if (!snap) return false;

  Object.entries(snap.storeData).forEach(([endpointSlug, records]) => {
    const storeKey = getStoreKey(user, endpointSlug, branch);
    const restored = JSON.parse(JSON.stringify(records));
    setStoreData(storeKey, restored);
    recordTransaction(
      user,
      branch,
      endpointSlug,
      "SYSTEM",
      `Restored snapshot "${snap.name}"`,
      restored
    );
  });

  return true;
}

// ---------------------------------------------------------------------------
// Scenario Presets Engine
// ---------------------------------------------------------------------------
export function applyScenarioPreset(
  storeKey: string,
  user: string,
  branch: string,
  endpointId: string,
  scenario: ScenarioPreset
): Record<string, unknown>[] {
  const records = JSON.parse(JSON.stringify(scenario.records || []));
  setStoreData(storeKey, records);
  recordTransaction(
    user,
    branch,
    endpointId,
    "SYSTEM",
    `Applied scenario preset "${scenario.name}"`,
    records
  );
  return records;
}

// ---------------------------------------------------------------------------
// Query String Parameters Processor (Pagination, Sorting, Filtering)
// ---------------------------------------------------------------------------
export interface QueryResult {
  data: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function applyQueryParameters(
  records: Record<string, unknown>[],
  searchParams: URLSearchParams
): QueryResult {
  let result = [...records];

  const page = parseInt(searchParams.get("page") || searchParams.get("_page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || searchParams.get("_limit") || "100", 10);
  const offset = parseInt(searchParams.get("offset") || searchParams.get("_offset") || "0", 10);
  const sortBy = searchParams.get("sortBy") || searchParams.get("_sort") || searchParams.get("sort");
  const order = (searchParams.get("order") || searchParams.get("_order") || "asc").toLowerCase();
  const search = searchParams.get("search") || searchParams.get("q") || searchParams.get("query");

  const reservedKeys = new Set(["page", "_page", "limit", "_limit", "offset", "_offset", "sortBy", "_sort", "sort", "order", "_order", "search", "q", "query"]);

  const groupedKeys = new Set(Array.from(searchParams.keys()));
  groupedKeys.forEach((key) => {
    if (reservedKeys.has(key)) return;

    const values = searchParams.getAll(key);
    let field = key;
    let operator = "=";
    let targetVal = values[0];

    if (key.endsWith(">=") || key.includes(">=")) {
      field = key.replace(/>=$/, "").split(">=")[0];
      operator = ">=";
      targetVal = key.includes(">=") && key.split(">=")[1] ? key.split(">=")[1] : values[0];
    } else if (key.endsWith("<=") || key.includes("<=")) {
      field = key.replace(/<=$/, "").split("<=")[0];
      operator = "<=";
      targetVal = key.includes("<=") && key.split("<=")[1] ? key.split("<=")[1] : values[0];
    } else if (key.endsWith("!=") || key.includes("!=")) {
      field = key.replace(/!=$/, "").split("!=")[0];
      operator = "!=";
      targetVal = key.includes("!=") && key.split("!=")[1] ? key.split("!=")[1] : values[0];
    } else if (key.endsWith(">")) {
      field = key.slice(0, -1);
      operator = ">=";
    } else if (key.endsWith("<")) {
      field = key.slice(0, -1);
      operator = "<=";
    } else if (key.includes(">")) {
      const parts = key.split(">");
      field = parts[0];
      operator = ">";
      targetVal = parts[1] || values[0];
    } else if (key.includes("<")) {
      const parts = key.split("<");
      field = parts[0];
      operator = "<";
      targetVal = parts[1] || values[0];
    } else if (key.endsWith("!")) {
      field = key.slice(0, -1);
      operator = "!=";
    } else if (key.endsWith("_gte")) {
      field = key.replace("_gte", "");
      operator = ">=";
    } else if (key.endsWith("_lte")) {
      field = key.replace("_lte", "");
      operator = "<=";
    } else if (key.endsWith("_ne")) {
      field = key.replace("_ne", "");
      operator = "!=";
    }

    result = result.filter((r) => {
      const actualRaw = getNestedValueByDotNotation(r, field) ?? r[field];
      if (actualRaw === undefined || actualRaw === null) return false;

      // Multi-value list inclusion (e.g. ?name=Guitar&name=Violin -> IN ['Guitar', 'Violin'])
      if (values.length > 1 && operator === "=") {
        return values.some((v) => String(actualRaw).toLowerCase() === String(v).toLowerCase());
      }
      if (values.length > 1 && operator === "!=") {
        return !values.some((v) => String(actualRaw).toLowerCase() === String(v).toLowerCase());
      }

      const actualNum = Number(actualRaw);
      const valNum = Number(targetVal);
      const isNumeric = !isNaN(actualNum) && !isNaN(valNum);

      switch (operator) {
        case ">=":
          return isNumeric ? actualNum >= valNum : String(actualRaw) >= String(targetVal);
        case "<=":
          return isNumeric ? actualNum <= valNum : String(actualRaw) <= String(targetVal);
        case ">":
          return isNumeric ? actualNum > valNum : String(actualRaw) > String(targetVal);
        case "<":
          return isNumeric ? actualNum < valNum : String(actualRaw) < String(targetVal);
        case "!=":
          return isNumeric ? actualNum !== valNum : String(actualRaw).toLowerCase() !== String(targetVal).toLowerCase();
        default:
          return isNumeric ? actualNum === valNum : String(actualRaw).toLowerCase() === String(targetVal).toLowerCase();
      }
    });
  });

  if (search) {
    const query = search.toLowerCase();
    result = result.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(query))
    );
  }

  if (sortBy) {
    const sortFields = sortBy.split(",").map((s) => s.trim()).filter(Boolean);

    result.sort((a, b) => {
      for (const rawField of sortFields) {
        const isDesc = rawField.startsWith("-");
        const cleanField = isDesc ? rawField.slice(1) : rawField;

        const valA = getNestedValueByDotNotation(a, cleanField) ?? a[cleanField];
        const valB = getNestedValueByDotNotation(b, cleanField) ?? b[cleanField];

        if (valA === valB) continue;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        let comp = 0;
        if (typeof valA === "number" && typeof valB === "number") {
          comp = valA - valB;
        } else {
          comp = String(valA).localeCompare(String(valB));
        }

        const fieldOrder = isDesc ? "desc" : order;
        const res = fieldOrder === "desc" ? -comp : comp;
        if (res !== 0) return res;
      }
      return 0;
    });
  }

  const total = result.length;
  const startIndex = offset > 0 ? offset : (page - 1) * limit;
  const paginatedData = result.slice(startIndex, startIndex + limit);

  return {
    data: paginatedData,
    total,
    page,
    limit,
    hasMore: startIndex + limit < total,
  };
}

// ---------------------------------------------------------------------------
// Nested Resource URL Subpath Resolver
// Supports both 2-arg (records, subpath) AND 5-arg (parentStore, parentId, childStore, childEndpointSlug, relations)
// ---------------------------------------------------------------------------
export function resolveNestedSubpathRecords(
  recordsOrParentStore: Record<string, unknown>[],
  subpathOrParentId: string[] | string,
  childStore?: Record<string, unknown>[],
  childEndpointSlug?: string,
  relations?: EntityRelation[]
): Record<string, unknown>[] {
  // 5-argument overload call
  if (typeof subpathOrParentId === "string" && Array.isArray(childStore)) {
    const parentId = subpathOrParentId;
    const parentRecord = recordsOrParentStore.find((r) => String(r.id) === parentId || String(r._id) === parentId);
    if (!parentRecord) return [];

    return childStore.filter(
      (c) =>
        String(c.userId) === parentId ||
        String(c.user_id) === parentId ||
        String(c.parentId) === parentId ||
        String(c.parent_id) === parentId
    );
  }

  // 2-argument overload call
  const records = recordsOrParentStore;
  const subpath = subpathOrParentId as string[];

  if (!subpath || subpath.length === 0) return records;

  if (subpath.length === 1) {
    const targetId = subpath[0];
    const match = records.find((r) => String(r.id) === targetId || String(r._id) === targetId);
    return match ? [match] : [];
  }

  const parentId = subpath[0];
  const relationName = subpath[1];
  const childId = subpath[2];

  const parentRecord = records.find((r) => String(r.id) === parentId || String(r._id) === parentId);
  if (!parentRecord) return [];

  let childRecords: Record<string, unknown>[] = [];
  if (Array.isArray(parentRecord[relationName])) {
    childRecords = parentRecord[relationName] as Record<string, unknown>[];
  } else {
    childRecords = records.filter(
      (r) =>
        String(r.userId) === parentId ||
        String(r.user_id) === parentId ||
        String(r.parentId) === parentId ||
        String(r.parent_id) === parentId
    );
  }

  if (childId) {
    const childMatch = childRecords.find((c) => String(c.id) === childId || String(c._id) === childId);
    return childMatch ? [childMatch] : [];
  }

  return childRecords;
}
