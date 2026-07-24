import { FieldDefinition, EntityRelation } from "@/lib/mock-generator";

export interface ParsedTableSchema {
  tableName: string;
  slug: string;
  name: string;
  responseType: "object" | "array";
  arrayLength: number;
  fields: FieldDefinition[];
  relations: EntityRelation[];
  isJunctionTable?: boolean;
  hasCompositeKey?: boolean;
}

export interface IntrospectionResult {
  tables: ParsedTableSchema[];
  summary: {
    tablesCount: number;
    relationsCount: number;
    junctionTablesCount: number;
    skippedViewsCount: number;
    skippedIndexesCount: number;
    warnings: string[];
  };
}

/**
 * Infer Mockbit Faker type based on column name heuristics (priority) and SQL type (fallback)
 */
export function inferFakerTypeFromColumn(colName: string, sqlDataType: string): FieldDefinition["type"] {
  const nameLower = colName.toLowerCase();
  const typeLower = sqlDataType.toLowerCase();

  // 1. Column Name Priority Heuristics
  if (nameLower === "id" || nameLower.endsWith("_id")) {
    if (typeLower.includes("uuid")) return "uuid";
    if (typeLower.includes("int") || typeLower.includes("serial")) return "number";
    return "uuid";
  }

  if (nameLower.includes("email")) return "email";
  if (nameLower.includes("name") || nameLower.includes("author") || nameLower.includes("customer")) return "fullName";
  if (nameLower.includes("price") || nameLower.includes("amount") || nameLower.includes("cost") || nameLower.includes("total") || nameLower.includes("salary") || nameLower.includes("balance")) return "currency";
  if (nameLower.includes("avatar") || nameLower.includes("image") || nameLower.includes("photo") || nameLower.includes("picture")) return "avatar";
  if (nameLower.includes("phone") || nameLower.includes("mobile")) return "phone";
  if (nameLower.includes("status") || nameLower.includes("state") || nameLower.includes("stage") || nameLower.includes("role") || nameLower.includes("category")) return "enum";
  if (nameLower.startsWith("is_") || nameLower.startsWith("has_") || nameLower.startsWith("active") || typeLower.includes("bool")) return "boolean";
  if (nameLower.includes("date") || nameLower.includes("time") || nameLower.endsWith("_at") || typeLower.includes("timestamp") || typeLower.includes("date")) return "date";

  // 2. SQL Data Type Fallbacks
  if (typeLower.includes("int") || typeLower.includes("decimal") || typeLower.includes("numeric") || typeLower.includes("float") || typeLower.includes("double")) return "number";
  if (typeLower.includes("bool")) return "boolean";
  if (typeLower.includes("uuid")) return "uuid";
  if (typeLower.includes("json")) return "object";

  return "company";
}

/**
 * Normalize table name into REST slug with deduplication
 */
export function normalizeSlug(tableName: string, existingSlugs: Set<string>): string {
  let baseSlug = tableName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!baseSlug) baseSlug = "resource";

  let slug = baseSlug;
  let counter = 2;
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  existingSlugs.add(slug);
  return slug;
}

/**
 * Two-Pass SQL DDL Introspection Parser
 */
export function parseSqlDdlToSchemas(sqlText: string, initialSlugs: Set<string> = new Set()): IntrospectionResult {
  const warnings: string[] = [];
  const existingSlugs = new Set<string>(initialSlugs);

  let skippedViewsCount = 0;
  let skippedIndexesCount = 0;

  // Count skipped statements
  const viewMatches = sqlText.match(/CREATE\s+VIEW/gi);
  if (viewMatches) skippedViewsCount = viewMatches.length;

  const indexMatches = sqlText.match(/CREATE\s+(UNIQUE\s+)?INDEX/gi);
  if (indexMatches) skippedIndexesCount = indexMatches.length;

  // Remove SQL comments
  const cleanSql = sqlText
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();

  // PASS 1: Parse all CREATE TABLE statements
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[a-zA-Z0-9_"]+\.)?["`]?([a-zA-Z0-9_]+)["`]?\s*\(([\s\S]*?)\);/gi;

  const tablesMap = new Map<string, ParsedTableSchema>();
  let match: RegExpExecArray | null;

  while ((match = createTableRegex.exec(cleanSql)) !== null) {
    const rawTableName = match[1];
    const body = match[2];

    const slug = normalizeSlug(rawTableName, existingSlugs);
    const friendlyName = rawTableName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const fields: FieldDefinition[] = [];
    const relations: EntityRelation[] = [];
    let hasCompositeKey = false;

    // Check composite primary key
    if (/PRIMARY\s+KEY\s*\([^)]*,[^)]*\)/i.test(body)) {
      hasCompositeKey = true;
      warnings.push(`Table '${rawTableName}' contains a composite primary key. Using synthetic single-column keys for mock API endpoints.`);
    }

    // Split column definitions by comma ignoring inside parentheses
    const lines: string[] = [];
    let currentLine = "";
    let parenDepth = 0;

    for (let i = 0; i < body.length; i++) {
      const char = body[i];
      if (char === "(") parenDepth++;
      else if (char === ")") parenDepth--;

      if (char === "," && parenDepth === 0) {
        lines.push(currentLine.trim());
        currentLine = "";
      } else {
        currentLine += char;
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());

    // Process column definitions and inline FKs
    for (const line of lines) {
      // Inline Foreign Key: FOREIGN KEY (col) REFERENCES target_table(col)
      const inlineFkMatch = /FOREIGN\s+KEY\s*\(["`]?([a-zA-Z0-9_]+)["`]?\)\s*REFERENCES\s+(?:[a-zA-Z0-9_"]+\.)?["`]?([a-zA-Z0-9_]+)["`]?\s*(?:\(["`]?([a-zA-Z0-9_]+)["`]?\))?\s*(?:ON\s+DELETE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION))?/i.exec(line);

      if (inlineFkMatch) {
        const fkCol = inlineFkMatch[1];
        const targetTable = inlineFkMatch[2];
        const targetKey = inlineFkMatch[3] || "id";
        const rawOnDelete = (inlineFkMatch[4] || "NO ACTION").toUpperCase();
        let onDeleteAction: "cascade" | "setNull" | "restrict" | undefined = undefined;
        if (rawOnDelete.includes("CASCADE")) onDeleteAction = "cascade";
        else if (rawOnDelete.includes("SET NULL")) onDeleteAction = "setNull";
        else if (rawOnDelete.includes("RESTRICT")) onDeleteAction = "restrict";

        relations.push({
          id: `rel_${rawTableName}_${fkCol}`,
          targetEndpoint: targetTable.toLowerCase().replace(/_/g, "-"),
          foreignKey: fkCol,
          targetKey: targetKey,
          type: "belongsTo",
          onDelete: onDeleteAction,
        });
        continue;
      }

      // Ignore constraint lines
      if (/^(PRIMARY\s+KEY|CONSTRAINT|UNIQUE|CHECK)/i.test(line)) continue;

      // Column definition: col_name data_type ...
      const colMatch = /^["`]?([a-zA-Z0-9_]+)["`]?\s+([a-zA-Z0-9_()]+)/i.exec(line);
      if (colMatch) {
        const colName = colMatch[1];
        const sqlDataType = colMatch[2];

        const fakerType = inferFakerTypeFromColumn(colName, sqlDataType);
        const options = fakerType === "enum" ? ["active", "pending", "completed", "disabled"] : undefined;

        fields.push({
          name: colName,
          type: fakerType,
          options,
        });
      }
    }

    tablesMap.set(rawTableName.toLowerCase(), {
      tableName: rawTableName,
      slug,
      name: friendlyName,
      responseType: "array",
      arrayLength: 10,
      fields,
      relations,
      hasCompositeKey,
    });
  }

  // PASS 2: Parse separate ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY statements
  const alterFkRegex = /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:[a-zA-Z0-9_"]+\.)?["`]?([a-zA-Z0-9_]+)["`]?\s+ADD\s+CONSTRAINT\s+[a-zA-Z0-9_"]+\s+FOREIGN\s+KEY\s*\(["`]?([a-zA-Z0-9_]+)["`]?\)\s*REFERENCES\s+(?:[a-zA-Z0-9_"]+\.)?["`]?([a-zA-Z0-9_]+)["`]?\s*\((?:["`]?([a-zA-Z0-9_]+)["`]?)\)\s*(?:ON\s+DELETE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION))?/gi;

  let alterMatch: RegExpExecArray | null;
  while ((alterMatch = alterFkRegex.exec(cleanSql)) !== null) {
    const srcTable = alterMatch[1].toLowerCase();
    const fkCol = alterMatch[2];
    const targetTable = alterMatch[3].toLowerCase();
    const targetKey = alterMatch[4] || "id";
    const rawOnDelete = (alterMatch[5] || "NO ACTION").toUpperCase();

    let onDeleteAction: "cascade" | "setNull" | "restrict" | undefined = undefined;
    if (rawOnDelete.includes("CASCADE")) onDeleteAction = "cascade";
    else if (rawOnDelete.includes("SET NULL")) onDeleteAction = "setNull";
    else if (rawOnDelete.includes("RESTRICT")) onDeleteAction = "restrict";

    const tableSchema = tablesMap.get(srcTable);
    if (tableSchema) {
      const exists = tableSchema.relations.some((r) => r.foreignKey === fkCol && r.targetEndpoint === targetTable.replace(/_/g, "-"));
      if (!exists) {
        tableSchema.relations.push({
          id: `rel_${srcTable}_${fkCol}`,
          targetEndpoint: targetTable.replace(/_/g, "-"),
          foreignKey: fkCol,
          targetKey: targetKey,
          type: "belongsTo",
          onDelete: onDeleteAction,
        });
      }
    }
  }

  // PASS 3: Detect Junction Tables (Refined Heuristic for Join Tables with extra payload columns like quantity/unit_price)
  let junctionTablesCount = 0;
  let totalRelationsCount = 0;

  for (const [, schema] of tablesMap) {
    totalRelationsCount += schema.relations.length;

    const fkFieldsCount = schema.relations.length;
    const nonMetadataFieldsCount = schema.fields.filter((f) => !["id", "created_at", "updated_at"].includes(f.name.toLowerCase())).length;

    // A junction table has 2+ FKs, and its FK count accounts for at least 50% of non-metadata columns OR non-FK payload fields <= 3
    const nonFkPayloadFieldsCount = Math.max(0, nonMetadataFieldsCount - fkFieldsCount);
    if (fkFieldsCount >= 2 && (nonFkPayloadFieldsCount <= 3 || fkFieldsCount / Math.max(1, nonMetadataFieldsCount) >= 0.5)) {
      schema.isJunctionTable = true;
      junctionTablesCount++;
    }
  }

  const tables = Array.from(tablesMap.values());

  return {
    tables,
    summary: {
      tablesCount: tables.length,
      relationsCount: totalRelationsCount,
      junctionTablesCount,
      skippedViewsCount,
      skippedIndexesCount,
      warnings,
    },
  };
}
