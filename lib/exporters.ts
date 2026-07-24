/**
 * OpenAPI 3.0 & Postman Collection v2.1 Exporters and Importers for Mockbit
 * FAANG-grade developer utility module.
 */

import { FieldDefinition } from "@/lib/mock-generator";

export interface MockEndpointSpec {
  name: string;
  slug: string;
  response_type: "object" | "array";
  array_length: number;
  status_code: number;
  latency_ms: number;
  schema_json: {
    fields?: FieldDefinition[];
    [key: string]: any;
  };
}

/**
 * Export a Mockbit endpoint to a standalone, zero-dependency HTML Test Bench web app
 */
export function exportToHtmlTestBench(
  name: string,
  slug: string,
  fields: FieldDefinition[],
  sampleOutput?: any,
  baseUrl: string = "http://localhost:3000"
): string {
  const cleanName = name || "Mock API Endpoint";
  const cleanSlug = slug || "endpoint";
  const endpointUrl = `${baseUrl}/api/v1/public/${cleanSlug}`;

  const jsonSampleStr = sampleOutput
    ? typeof sampleOutput === "string" ? sampleOutput : JSON.stringify(sampleOutput, null, 2)
    : "[]";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanName} — Interactive Test Bench</title>
  <style>
    :root {
      --bg: #09090b;
      --surface: #121215;
      --border: #27272a;
      --text: #f4f4f5;
      --muted: #a1a1aa;
      --accent: #3b82f6;
      --success: #22c55e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      padding: 2rem;
      max-width: 900px;
      margin: 0 auto;
    }
    header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }
    h1 { font-size: 1.25rem; font-weight: 600; }
    .url-badge {
      display: inline-block;
      margin-top: 0.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      color: var(--muted);
    }
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .btn {
      background: var(--accent);
      color: #fff;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
    }
    .btn:hover { opacity: 0.9; }
    pre {
      background: #000;
      border: 1px solid var(--border);
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 0.8rem;
      color: #38bdf8;
      max-height: 400px;
    }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: bold;
      background: var(--success);
      color: #000;
      margin-left: 0.5rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>${cleanName} — Live Test Bench</h1>
    <div class="url-badge">GET <span id="targetUrl">${endpointUrl}</span></div>
  </header>

  <div class="panel">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h2 style="font-size: 0.9rem; color: var(--muted);">LIVE HTTP REQUEST</h2>
      <button class="btn" onclick="sendRequest()">Send GET Request</button>
    </div>
    <div id="statusArea" style="margin-bottom: 1rem; font-size: 0.8rem; color: var(--muted);">
      Ready to send request.
    </div>
    <pre><code id="output">${jsonSampleStr}</code></pre>
  </div>

  <script>
    async function sendRequest() {
      const outputEl = document.getElementById('output');
      const statusEl = document.getElementById('statusArea');
      const targetUrl = document.getElementById('targetUrl').innerText;

      statusEl.innerHTML = 'Sending request...';
      const startTime = Date.now();

      try {
        const res = await fetch(targetUrl);
        const data = await res.json();
        const latency = Date.now() - startTime;

        statusEl.innerHTML = 'Status: <span class="badge">' + res.status + ' OK</span> execution time: ' + latency + 'ms';
        outputEl.innerText = JSON.stringify(data, null, 2);
      } catch (err) {
        statusEl.innerHTML = '<span style="color: #ef4444;">Request Failed: ' + err.message + '</span>';
      }
    }
  </script>
</body>
</html>`;
}

/**
 * Export a Mockbit endpoint definition to GitHub-flavored Markdown API Documentation
 */
export function exportToMarkdownDoc(
  name: string,
  slug: string,
  fields: FieldDefinition[],
  sampleOutput?: any,
  baseUrl: string = "http://localhost:3000"
): string {
  const cleanName = name || "Mock API Endpoint";
  const cleanSlug = slug || "endpoint";
  const endpointUrl = `${baseUrl}/api/v1/public/${cleanSlug}`;

  let md = `# ${cleanName} Specification\n\n`;
  md += `Official API documentation generated by **Mockbit** — Instant Mock API Generator & Synthetic Event Substrate.\n\n`;
  md += `## 🚀 HTTP Endpoint\n\n`;
  md += `\`GET ${endpointUrl}\`\n\n`;
  md += `### Headers\n| Header | Required | Value |\n| :--- | :--- | :--- |\n| \`Content-Type\` | Yes | \`application/json\` |\n| \`X-Mockbit-Branch\` | Optional | \`main\` (Environment branch isolation) |\n\n`;

  md += `## 📋 Response Field Schema\n\n`;
  md += `| Field Name | Type | Description / Format |\n`;
  md += `| :--- | :--- | :--- |\n`;

  fields.forEach((f) => {
    let desc = "Mock property field";
    if (f.type === "enum" && f.options) {
      desc = `Enum values: \`${f.options.join("`, `")}\``;
    } else if (f.type === "template" && f.template) {
      desc = `Template pattern: \`${f.template}\``;
    } else {
      desc = `Generator type: \`${f.type}\``;
    }
    md += `| \`${f.name}\` | \`${f.type}\` | ${desc} |\n`;
  });

  if (sampleOutput) {
    const jsonStr = typeof sampleOutput === "string" ? sampleOutput : JSON.stringify(sampleOutput, null, 2);
    md += `\n## 🧪 Sample JSON Response\n\n\`\`\`json\n${jsonStr}\n\`\`\`\n`;
  }

  return md;
}

/**
 * Export a list of Mockbit field definitions as a SQL CREATE TABLE DDL script
 */
export function exportToSqlTableDDL(
  tableName: string,
  fields: FieldDefinition[],
  dialect: "postgres" | "mysql" = "postgres"
): string {
  const cleanTableName = tableName.toLowerCase().replace(/[^a-z0-9_]/g, "_") || "records";
  const columns: string[] = [];

  fields.forEach((f) => {
    const colName = f.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    let typeSql = "VARCHAR(255)";

    switch (f.type) {
      case "uuid":
        typeSql = dialect === "postgres" ? "UUID" : "VARCHAR(36)";
        break;
      case "number":
      case "currency":
        typeSql = "DECIMAL(10, 2)";
        break;
      case "boolean":
        typeSql = dialect === "postgres" ? "BOOLEAN" : "TINYINT(1)";
        break;
      case "date":
      case "futureDate":
        typeSql = dialect === "postgres" ? "TIMESTAMP WITH TIME ZONE" : "DATETIME";
        break;
      case "bcrypt":
        typeSql = "VARCHAR(60)";
        break;
      case "mac":
        typeSql = "VARCHAR(17)";
        break;
      case "ip":
        typeSql = "VARCHAR(45)";
        break;
      case "ssn":
        typeSql = "VARCHAR(11)";
        break;
      case "object":
      case "array":
        typeSql = dialect === "postgres" ? "JSONB" : "JSON";
        break;
      default:
        typeSql = "VARCHAR(255)";
        break;
    }

    if (colName === "id" || colName === "_id") {
      columns.push(`  ${colName} ${typeSql} PRIMARY KEY`);
    } else {
      columns.push(`  ${colName} ${typeSql}`);
    }
  });

  return `-- Generated by Mockbit SQL DDL Exporter (${dialect.toUpperCase()} Dialect)\nCREATE TABLE ${cleanTableName} (\n${columns.join(",\n")}\n);`;
}

/**
 * Export a Mockbit endpoint definition to OpenAPI 3.0 JSON
 */
export function exportToOpenAPI(endpoint: MockEndpointSpec, baseUrl: string = "http://localhost:3000"): string {
  const fields = endpoint.schema_json?.fields || [];
  
  const properties: Record<string, any> = {};
  fields.forEach((f) => {
    switch (f.type) {
      case "number":
      case "currency":
        properties[f.name] = { type: "number", example: 99.99 };
        break;
      case "boolean":
        properties[f.name] = { type: "boolean", example: true };
        break;
      case "enum":
        properties[f.name] = { type: "string", enum: f.options || ["active", "pending"] };
        break;
      case "date":
      case "futureDate":
        properties[f.name] = { type: "string", format: "date-time" };
        break;
      case "uuid":
        properties[f.name] = { type: "string", format: "uuid" };
        break;
      default:
        properties[f.name] = { type: "string", example: "sample_value" };
        break;
    }
  });

  const schemaObj = {
    type: "object",
    properties,
  };

  const openApiDoc = {
    openapi: "3.0.3",
    info: {
      title: endpoint.name,
      description: `Generated by Mockbit — Instant Mock API Generator`,
      version: "1.0.0",
    },
    servers: [
      {
        url: baseUrl,
        description: "Mockbit Live Mock Server",
      },
    ],
    paths: {
      [`/api/v1/demo/${endpoint.slug}`]: {
        get: {
          summary: `Fetch ${endpoint.name}`,
          operationId: `get_${endpoint.slug.replace(/[^a-zA-Z0-9]/g, "_")}`,
          responses: {
            [endpoint.status_code || 200]: {
              description: "Successful mock response",
              headers: {
                "Access-Control-Allow-Origin": {
                  schema: { type: "string" },
                  example: "*",
                },
              },
              content: {
                "application/json": {
                  schema: endpoint.response_type === "array"
                    ? { type: "array", items: schemaObj }
                    : schemaObj,
                },
              },
            },
          },
        },
      },
    },
  };

  return JSON.stringify(openApiDoc, null, 2);
}

/**
 * Export a Mockbit endpoint definition to Postman Collection v2.1 JSON
 */
export function exportToPostman(endpoint: MockEndpointSpec, baseUrl: string = "http://localhost:3000"): string {
  const fullUrl = `${baseUrl}/api/v1/demo/${endpoint.slug}`;
  const postmanDoc = {
    info: {
      name: `Mockbit - ${endpoint.name}`,
      description: `Postman Collection generated by Mockbit for ${endpoint.slug}`,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: [
      {
        name: endpoint.name,
        request: {
          method: "GET",
          header: [
            {
              key: "Accept",
              value: "application/json",
            },
          ],
          url: {
            raw: fullUrl,
            protocol: "http",
            host: [baseUrl.replace(/^https?:\/\//, "").split(":")[0]],
            port: baseUrl.split(":")[2] || "3000",
            path: ["api", "v1", "demo", endpoint.slug],
          },
        },
        response: [],
      },
    ],
  };

  return JSON.stringify(postmanDoc, null, 2);
}

/**
 * Parse an OpenAPI 3.0 or raw JSON spec into Mockbit FieldDefinitions
 */
export function parseOpenApiToFields(jsonString: string): FieldDefinition[] {
  try {
    const data = JSON.parse(jsonString);

    // If raw properties object
    let propertiesObj = data?.properties || data?.components?.schemas?.Item?.properties;

    // If standard OpenAPI path response schema
    if (!propertiesObj && data?.paths) {
      const firstPathKey = Object.keys(data.paths)[0];
      const firstMethod = data.paths[firstPathKey]?.get || data.paths[firstPathKey]?.post;
      const jsonSchema = firstMethod?.responses?.["200"]?.content?.["application/json"]?.schema;
      propertiesObj = jsonSchema?.properties || jsonSchema?.items?.properties;
    }

    if (propertiesObj && typeof propertiesObj === "object") {
      return Object.entries(propertiesObj).map(([key, prop]: [string, any]) => {
        let type: FieldDefinition["type"] = "lorem";
        if (prop.type === "number" || prop.type === "integer") type = "number";
        else if (prop.type === "boolean") type = "boolean";
        else if (prop.format === "uuid" || key.toLowerCase().includes("id")) type = "uuid";
        else if (prop.format === "date-time" || key.toLowerCase().includes("date")) type = "date";
        else if (key.toLowerCase().includes("email")) type = "email";
        else if (key.toLowerCase().includes("name")) type = "fullName";
        else if (prop.enum) return { name: key, type: "enum" as const, options: prop.enum };

        return { name: key, type };
      });
    }
  } catch (err) {
    console.warn("Failed to parse OpenAPI JSON:", err);
  }

  return [
    { name: "id", type: "uuid" },
    { name: "title", type: "lorem" },
    { name: "status", type: "enum", options: ["active", "pending"] },
  ];
}

/**
 * Parse any dropped or uploaded file (JSON, OpenAPI, Postman, Workspace Backup) into Mockbit Endpoints
 */
export function parseFileToEndpoints(fileContent: string, fileName: string): MockEndpointSpec[] {
  try {
    const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
    const parsed = JSON.parse(fileContent);

    // 1. Workspace Backup (Array of endpoints or object with endpoints array)
    if (Array.isArray(parsed) && parsed[0]?.slug && parsed[0]?.schema_json) {
      return parsed;
    }
    if (parsed.mockbit_workspace && Array.isArray(parsed.endpoints)) {
      return parsed.endpoints;
    }

    // 2. Postman Collection v2.1
    if (parsed.info?.schema?.includes("postman")) {
      const items = parsed.item || [];
      const endpoints: MockEndpointSpec[] = [];
      items.forEach((item: any, idx: number) => {
        const itemSlug = (item.name || `postman-api-${idx}`).toLowerCase().replace(/[^a-z0-9-]/g, "-");
        endpoints.push({
          name: item.name || `Postman Endpoint ${idx + 1}`,
          slug: itemSlug,
          response_type: "array",
          array_length: 5,
          status_code: 200,
          latency_ms: 0,
          schema_json: {
            fields: [
              { name: "id", type: "uuid" },
              { name: "name", type: "fullName" },
              { name: "status", type: "enum", options: ["active", "pending"] },
            ],
          },
        });
      });
      return endpoints.length > 0 ? endpoints : [];
    }

    // 3. OpenAPI 3.0 Document
    if (parsed.openapi || parsed.swagger) {
      const importedFields = parseOpenApiToFields(fileContent);
      return [
        {
          name: parsed.info?.title || cleanName || "OpenAPI Endpoint",
          slug: cleanName || "openapi-endpoint",
          response_type: "array",
          array_length: 5,
          status_code: 200,
          latency_ms: 0,
          schema_json: { fields: importedFields },
        },
      ];
    }

    // 4. Raw JSON Object or Array
    const sampleObj = Array.isArray(parsed) ? parsed[0] : parsed;
    if (sampleObj && typeof sampleObj === "object") {
      const fields: FieldDefinition[] = Object.keys(sampleObj).map((key) => ({
        name: key,
        type: "lorem",
      }));

      return [
        {
          name: cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : "Imported API",
          slug: cleanName || `imported-${Date.now()}`,
          response_type: Array.isArray(parsed) ? "array" : "object",
          array_length: Array.isArray(parsed) ? Math.min(parsed.length, 10) : 5,
          status_code: 200,
          latency_ms: 0,
          schema_json: { fields, raw_json: sampleObj },
        },
      ];
    }
  } catch {
    // Non-JSON or YAML fallback
  }

  const slug = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
  return [
    {
      name: `Imported ${slug}`,
      slug: slug || `imported-${Date.now()}`,
      response_type: "array",
      array_length: 5,
      status_code: 200,
      latency_ms: 0,
      schema_json: {
        fields: [
          { name: "id", type: "uuid" },
          { name: "title", type: "lorem" },
          { name: "created_at", type: "date" },
        ],
      },
    },
  ];
}

/**
 * Export a Mockbit endpoint to TypeScript Type Definitions
 */
export function exportToTypeScript(endpoint: MockEndpointSpec): string {
  const fields = endpoint.schema_json?.fields || [];
  const interfaceName = `${endpoint.name.replace(/[^a-zA-Z0-9]/g, "")}Item`;

  let code = `export interface ${interfaceName} {\n`;
  fields.forEach((f) => {
    let tsType = "string";
    if (f.type === "number" || f.type === "currency") tsType = "number";
    else if (f.type === "boolean") tsType = "boolean";
    else if (f.type === "enum" && f.options && f.options.length > 0) {
      tsType = f.options.map((opt) => `"${opt}"`).join(" | ");
    }
    code += `  ${f.name}: ${tsType};\n`;
  });

  if (fields.length === 0) {
    code += `  [key: string]: unknown;\n`;
  }
  code += `}\n\n`;

  if (endpoint.response_type === "array") {
    code += `export type ${endpoint.name.replace(/[^a-zA-Z0-9]/g, "")}Response = ${interfaceName}[];\n`;
  } else {
    code += `export type ${endpoint.name.replace(/[^a-zA-Z0-9]/g, "")}Response = ${interfaceName};\n`;
  }

  return code;
}

/**
 * Export a Mockbit endpoint to Zod Runtime Validation Schema
 */
export function exportToZod(endpoint: MockEndpointSpec): string {
  const fields = endpoint.schema_json?.fields || [];
  const schemaName = `${endpoint.slug.replace(/[^a-zA-Z0-9]/g, "_")}ItemSchema`;

  let code = `import { z } from "zod";\n\n`;
  code += `export const ${schemaName} = z.object({\n`;

  fields.forEach((f) => {
    let zodDef = "z.string()";
    if (f.type === "uuid") zodDef = "z.string().uuid()";
    else if (f.type === "email") zodDef = "z.string().email()";
    else if (f.type === "url") zodDef = "z.string().url()";
    else if (f.type === "date" || f.type === "futureDate") zodDef = "z.string().datetime()";
    else if (f.type === "number" || f.type === "currency") zodDef = "z.number()";
    else if (f.type === "boolean") zodDef = "z.boolean()";
    else if (f.type === "enum" && f.options && f.options.length > 0) {
      zodDef = `z.enum([${f.options.map((o) => `"${o}"`).join(", ")}])`;
    }

    code += `  ${f.name}: ${zodDef},\n`;
  });

  if (fields.length === 0) {
    code += `  id: z.string().uuid(),\n`;
  }

  code += `});\n\n`;

  if (endpoint.response_type === "array") {
    code += `export const ${endpoint.slug.replace(/[^a-zA-Z0-9]/g, "_")}ResponseSchema = z.array(${schemaName});\n`;
  } else {
    code += `export const ${endpoint.slug.replace(/[^a-zA-Z0-9]/g, "_")}ResponseSchema = ${schemaName};\n`;
  }

  return code;
}

/**
 * Export a Mockbit endpoint to Prisma ORM Model Definition
 */
export function exportToPrisma(endpoint: MockEndpointSpec): string {
  const fields = endpoint.schema_json?.fields || [];
  const modelName = endpoint.name.replace(/[^a-zA-Z0-9]/g, "");

  let code = `model ${modelName} {\n`;
  fields.forEach((f) => {
    let prismaType = "String";
    let isId = f.name === "id" ? " @id @default(uuid())" : "";
    if (f.type === "number" || f.type === "currency") prismaType = "Float";
    else if (f.type === "boolean") prismaType = "Boolean";
    else if (f.type === "date" || f.type === "futureDate") prismaType = "DateTime @default(now())";

    code += `  ${f.name.padEnd(16)} ${prismaType}${isId}\n`;
  });

  if (!fields.some((f) => f.name === "id")) {
    code += `  id               String   @id @default(uuid())\n`;
  }

  code += `  createdAt        DateTime @default(now())\n`;
  code += `  updatedAt        DateTime @updatedAt\n`;
  code += `}\n`;

  return code;
}

/**
 * Export a Mockbit endpoint to Swift Codable Struct
 */
export function exportToSwift(endpoint: MockEndpointSpec): string {
  const fields = endpoint.schema_json?.fields || [];
  const structName = endpoint.name.replace(/[^a-zA-Z0-9]/g, "");

  let code = `import Foundation\n\n`;
  code += `struct ${structName}: Codable, Identifiable {\n`;

  fields.forEach((f) => {
    let swiftType = "String";
    if (f.type === "number" || f.type === "currency") swiftType = "Double";
    else if (f.type === "boolean") swiftType = "Bool";

    const camelKey = f.name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    code += `    let ${camelKey}: ${swiftType}\n`;
  });

  if (fields.length === 0) {
    code += `    let id: String\n`;
  }

  code += `}\n`;
  return code;
}

/**
 * Export a Mockbit endpoint to Kotlin Data Class
 */
export function exportToKotlin(endpoint: MockEndpointSpec): string {
  const fields = endpoint.schema_json?.fields || [];
  const className = endpoint.name.replace(/[^a-zA-Z0-9]/g, "");

  let code = `import kotlinx.serialization.Serializable\n\n`;
  code += `@Serializable\n`;
  code += `data class ${className}(\n`;

  fields.forEach((f, idx) => {
    let kotlinType = "String";
    if (f.type === "number" || f.type === "currency") kotlinType = "Double";
    else if (f.type === "boolean") kotlinType = "Boolean";

    const camelKey = f.name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    const comma = idx === fields.length - 1 ? "" : ",";
    code += `    val ${camelKey}: ${kotlinType}${comma}\n`;
  });

  if (fields.length === 0) {
    code += `    val id: String\n`;
  }

  code += `)\n`;
  return code;
}

/**
 * Export mock dataset records to CSV string
 */
export function exportToCSV(records: Record<string, any>[]): string {
  if (!records || records.length === 0) return "";

  const headers = Object.keys(records[0]);
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.join(","));

  // Data rows
  records.forEach((row) => {
    const values = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return '""';
      if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      const strVal = String(val);
      if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n")) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    });
    csvRows.push(values.join(","));
  });

  return csvRows.join("\n");
}

/**
 * Export mock dataset records to SQL INSERT script
 */
export function exportToSQL(tableName: string, records: Record<string, any>[]): string {
  if (!records || records.length === 0) return `-- No records to export for ${tableName}\n`;

  const cleanTableName = tableName.toLowerCase().replace(/[^a-z0-9_]/g, "_") || "mock_table";
  const headers = Object.keys(records[0]);
  const sqlLines: string[] = [`-- SQL Seed Script generated by Mockbit`];

  records.forEach((row) => {
    const columns = headers.join(", ");
    const values = headers
      .map((header) => {
        const val = row[header];
        if (val === null || val === undefined) return "NULL";
        if (typeof val === "number") return val;
        if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
        if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        return `'${String(val).replace(/'/g, "''")}'`;
      })
      .join(", ");

    sqlLines.push(`INSERT INTO ${cleanTableName} (${columns}) VALUES (${values});`);
  });

  return sqlLines.join("\n");
}

/**
 * Export mock dataset records to XML format string
 */
export function exportToXML(rootName: string, records: Record<string, any>[]): string {
  const cleanRoot = rootName.toLowerCase().replace(/[^a-z0-9_]/g, "_") || "records";
  const itemTag = cleanRoot.endsWith("s") ? cleanRoot.slice(0, -1) : "record";

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${cleanRoot}>\n`;

  records.forEach((row) => {
    xml += `  <${itemTag}>\n`;
    Object.entries(row).forEach(([key, val]) => {
      const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, "_");
      if (val === null || val === undefined) {
        xml += `    <${cleanKey}/>\n`;
      } else if (typeof val === "object") {
        xml += `    <${cleanKey}>${escapeXml(JSON.stringify(val))}</${cleanKey}>\n`;
      } else {
        xml += `    <${cleanKey}>${escapeXml(String(val))}</${cleanKey}>\n`;
      }
    });
    xml += `  </${itemTag}>\n`;
  });

  xml += `</${cleanRoot}>\n`;
  return xml;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}

/**
 * Parse Postman Collection v2.1 JSON string into Mockbit Endpoint Spec & FieldDefinitions
 */
export function parsePostmanCollection(jsonString: string): {
  name: string;
  slug: string;
  fields: FieldDefinition[];
  sampleData?: any;
} {
  const collection = JSON.parse(jsonString);
  const name = collection.info?.name || "Imported Postman Endpoint";
  let slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  if (!slug || slug === "-") slug = "postman-endpoint";

  let sampleData: any = null;
  const fields: FieldDefinition[] = [];

  // Extract first request item with response body or query parameters
  const items = collection.item || [];
  const firstItem = items[0] || {};
  const request = firstItem.request || {};
  const responses = firstItem.response || [];

  if (responses.length > 0 && responses[0].body) {
    try {
      sampleData = JSON.parse(responses[0].body);
    } catch {
      sampleData = null;
    }
  }

  if (!sampleData && request.body?.raw) {
    try {
      sampleData = JSON.parse(request.body.raw);
    } catch {
      sampleData = null;
    }
  }

  // Infer fields from sampleData or URL path/query
  if (sampleData) {
    const targetObj = Array.isArray(sampleData) ? sampleData[0] : sampleData;
    if (targetObj && typeof targetObj === "object") {
      Object.entries(targetObj).forEach(([key, val]) => {
        let type: FieldDefinition["type"] = "lorem";
        if (typeof val === "number") type = "number";
        else if (typeof val === "boolean") type = "boolean";
        else if (key.toLowerCase().includes("id")) type = "uuid";
        else if (key.toLowerCase().includes("email")) type = "email";
        else if (key.toLowerCase().includes("name")) type = "fullName";
        else if (key.toLowerCase().includes("date")) type = "date";

        fields.push({ name: key, type });
      });
    }
  }

  if (fields.length === 0) {
    fields.push({ name: "id", type: "uuid" });
    fields.push({ name: "name", type: "fullName" });
    fields.push({ name: "email", type: "email" });
    fields.push({ name: "created_at", type: "date" });
  }

  return { name, slug, fields, sampleData };
}

/**
 * Parse terminal cURL command string into Mockbit Endpoint Spec & FieldDefinitions
 */
export function parseCurlCommand(curlCmd: string): {
  name: string;
  slug: string;
  method: string;
  fields: FieldDefinition[];
  sampleData?: any;
} {
  const cleanCmd = curlCmd.replace(/\\\n/g, " ").trim();

  let method = "GET";
  const methodMatch = cleanCmd.match(/(?:-X|--request)\s+([A-Z]+)/i);
  if (methodMatch && methodMatch[1]) {
    method = methodMatch[1].toUpperCase();
  } else if (cleanCmd.includes("-d") || cleanCmd.includes("--data")) {
    method = "POST";
  }

  let rawUrl = "";
  const urlMatch = cleanCmd.match(/(?:curl\s+)?["']?(https?:\/\/[^\s"']+)["']?/i);
  if (urlMatch && urlMatch[1]) {
    rawUrl = urlMatch[1];
  }

  let slug = "curl-endpoint";
  let name = "Imported cURL Endpoint";

  if (rawUrl) {
    try {
      const parsedUrl = new URL(rawUrl);
      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        slug = pathParts[pathParts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, "-");
        name = `${slug.replace(/-/g, " ").toUpperCase()} API`;
      }
    } catch {
      // Ignore URL parse failure
    }
  }

  let sampleData: any = null;
  const dataMatch = cleanCmd.match(/(?:-d|--data|--data-raw)\s+["']?(\{[\s\S]*?\}|\[[\s\S]*?\])["']?/);
  if (dataMatch && dataMatch[1]) {
    try {
      sampleData = JSON.parse(dataMatch[1]);
    } catch {
      sampleData = null;
    }
  }

  const fields: FieldDefinition[] = [];
  if (sampleData) {
    const targetObj = Array.isArray(sampleData) ? sampleData[0] : sampleData;
    if (targetObj && typeof targetObj === "object") {
      Object.entries(targetObj).forEach(([key, val]) => {
        let type: FieldDefinition["type"] = "lorem";
        if (typeof val === "number") type = "number";
        else if (typeof val === "boolean") type = "boolean";
        else if (key.toLowerCase().includes("id")) type = "uuid";
        else if (key.toLowerCase().includes("email")) type = "email";
        else if (key.toLowerCase().includes("name")) type = "fullName";
        else if (key.toLowerCase().includes("date")) type = "date";

        fields.push({ name: key, type });
      });
    }
  }

  if (fields.length === 0) {
    fields.push({ name: "id", type: "uuid" });
    fields.push({ name: "name", type: "fullName" });
    fields.push({ name: "email", type: "email" });
    fields.push({ name: "status", type: "enum", options: ["active", "pending"] });
  }

  return { name, slug, method, fields, sampleData };
}

/**
 * Parse Insomnia v4/v5 export JSON string into Mockbit Endpoint Spec & FieldDefinitions
 */
export function parseInsomniaCollection(jsonString: string): {
  name: string;
  slug: string;
  method: string;
  fields: FieldDefinition[];
  sampleData?: any;
} {
  const insomniaData = JSON.parse(jsonString);
  let name = "Imported Insomnia Endpoint";
  let slug = "insomnia-endpoint";
  let method = "GET";
  let sampleData: any = null;

  const resources = insomniaData.resources || [];
  const reqResource = resources.find((r: any) => r._type === "request") || {};

  if (reqResource.name) {
    name = reqResource.name;
    slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  }

  if (reqResource.method) {
    method = reqResource.method.toUpperCase();
  }

  if (reqResource.body?.text) {
    try {
      sampleData = JSON.parse(reqResource.body.text);
    } catch {
      sampleData = null;
    }
  }

  const fields: FieldDefinition[] = [];
  if (sampleData) {
    const targetObj = Array.isArray(sampleData) ? sampleData[0] : sampleData;
    if (targetObj && typeof targetObj === "object") {
      Object.entries(targetObj).forEach(([key, val]) => {
        let type: FieldDefinition["type"] = "lorem";
        if (typeof val === "number") type = "number";
        else if (typeof val === "boolean") type = "boolean";
        else if (key.toLowerCase().includes("id")) type = "uuid";
        else if (key.toLowerCase().includes("email")) type = "email";
        else if (key.toLowerCase().includes("name")) type = "fullName";
        else if (key.toLowerCase().includes("date")) type = "date";

        fields.push({ name: key, type });
      });
    }
  }

  if (fields.length === 0) {
    fields.push({ name: "id", type: "uuid" });
    fields.push({ name: "name", type: "fullName" });
    fields.push({ name: "email", type: "email" });
    fields.push({ name: "status", type: "enum", options: ["active", "pending"] });
  }

  return { name, slug, method, fields, sampleData };
}

/**
 * Parse Chrome/Firefox DevTools W3C HAR 1.2 JSON string into Mockbit Endpoint Specs
 */
export function parseHarArchive(jsonString: string): Array<{
  name: string;
  slug: string;
  method: string;
  fields: FieldDefinition[];
  sampleData?: any;
}> {
  const harData = JSON.parse(jsonString);
  const entries = harData.log?.entries || [];

  const results: Array<{
    name: string;
    slug: string;
    method: string;
    fields: FieldDefinition[];
    sampleData?: any;
  }> = [];

  entries.forEach((entry: any) => {
    const request = entry.request || {};
    const response = entry.response || {};
    const url = request.url || "";
    const method = (request.method || "GET").toUpperCase();

    let slug = "har-endpoint";
    let name = "Imported HAR Endpoint";

    try {
      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        slug = pathParts[pathParts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, "-");
        name = `${slug.replace(/-/g, " ").toUpperCase()} API`;
      }
    } catch {
      // Ignore URL parse failure
    }

    let sampleData: any = null;
    const responseText = response.content?.text;
    if (responseText) {
      try {
        sampleData = JSON.parse(responseText);
      } catch {
        sampleData = null;
      }
    }

    const fields: FieldDefinition[] = [];
    if (sampleData) {
      const targetObj = Array.isArray(sampleData) ? sampleData[0] : sampleData;
      if (targetObj && typeof targetObj === "object") {
        Object.entries(targetObj).forEach(([key, val]) => {
          let type: FieldDefinition["type"] = "lorem";
          if (typeof val === "number") type = "number";
          else if (typeof val === "boolean") type = "boolean";
          else if (key.toLowerCase().includes("id")) type = "uuid";
          else if (key.toLowerCase().includes("email")) type = "email";
          else if (key.toLowerCase().includes("name")) type = "fullName";
          else if (key.toLowerCase().includes("date")) type = "date";

          fields.push({ name: key, type });
        });
      }
    }

    if (fields.length === 0) {
      fields.push({ name: "id", type: "uuid" });
      fields.push({ name: "name", type: "fullName" });
      fields.push({ name: "email", type: "email" });
    }

    results.push({ name, slug, method, fields, sampleData });
  });

  if (results.length === 0) {
    results.push({
      name: "Imported HAR Endpoint",
      slug: "har-endpoint",
      method: "GET",
      fields: [
        { name: "id", type: "uuid" },
        { name: "name", type: "fullName" },
        { name: "email", type: "email" },
      ],
    });
  }

  return results;
}

/**
 * Parse WireMock JSON Stub Mapping string into Mockbit Endpoint Spec & FieldDefinitions
 */
export function parseWireMockMapping(jsonString: string): {
  name: string;
  slug: string;
  method: string;
  fields: FieldDefinition[];
  sampleData?: any;
} {
  const wiremockObj = JSON.parse(jsonString);
  const stub = wiremockObj.mappings ? wiremockObj.mappings[0] : wiremockObj;

  const request = stub.request || {};
  const response = stub.response || {};

  let method = (request.method || "GET").toUpperCase();
  let rawUrl = request.url || request.urlPattern || request.urlPathPattern || request.urlPath || "";

  let slug = "wiremock-endpoint";
  let name = "Imported WireMock Stub";

  if (rawUrl) {
    const cleanUrlPath = rawUrl.replace(/[\^\$\?\*]/g, "");
    const parts = cleanUrlPath.split("/").filter(Boolean);
    if (parts.length > 0) {
      slug = parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, "-");
      name = `${slug.replace(/-/g, " ").toUpperCase()} API`;
    }
  }

  let sampleData: any = null;
  if (response.jsonBody) {
    sampleData = response.jsonBody;
  } else if (response.body) {
    try {
      sampleData = JSON.parse(response.body);
    } catch {
      sampleData = null;
    }
  }

  const fields: FieldDefinition[] = [];
  if (sampleData) {
    const targetObj = Array.isArray(sampleData) ? sampleData[0] : sampleData;
    if (targetObj && typeof targetObj === "object") {
      Object.entries(targetObj).forEach(([key, val]) => {
        let type: FieldDefinition["type"] = "lorem";
        if (typeof val === "number") type = "number";
        else if (typeof val === "boolean") type = "boolean";
        else if (key.toLowerCase().includes("id")) type = "uuid";
        else if (key.toLowerCase().includes("email")) type = "email";
        else if (key.toLowerCase().includes("name")) type = "fullName";
        else if (key.toLowerCase().includes("date")) type = "date";

        fields.push({ name: key, type });
      });
    }
  }

  if (fields.length === 0) {
    fields.push({ name: "id", type: "uuid" });
    fields.push({ name: "name", type: "fullName" });
    fields.push({ name: "email", type: "email" });
    fields.push({ name: "status", type: "enum", options: ["active", "pending"] });
  }

  return { name, slug, method, fields, sampleData };
}

/**
 * Parse GraphQL Schema Definition Language (SDL) string into Mockbit Endpoint Spec & FieldDefinitions
 */
export function parseGraphQLSdl(sdlString: string): {
  name: string;
  slug: string;
  fields: FieldDefinition[];
} {
  let name = "Imported GraphQL Schema";
  let slug = "graphql-schema";
  const fields: FieldDefinition[] = [];

  const typeMatch = sdlString.match(/type\s+([a-zA-Z0-9_]+)\s*\{([^}]+)\}/i);
  if (typeMatch) {
    if (typeMatch[1]) {
      name = `${typeMatch[1]} API`;
      slug = typeMatch[1].toLowerCase().replace(/[^a-z0-9]/g, "-");
    }

    if (typeMatch[2]) {
      const lineItems = typeMatch[2].split("\n").map((l) => l.trim()).filter(Boolean);
      lineItems.forEach((line) => {
        const fieldMatch = line.match(/^([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_!\[\]]+)/);
        if (fieldMatch) {
          const fName = fieldMatch[1];
          const rawType = fieldMatch[2].replace(/[!\[\]]/g, "").toLowerCase();

          let type: FieldDefinition["type"] = "lorem";
          if (rawType === "id" || fName.toLowerCase().includes("id")) type = "uuid";
          else if (rawType === "int" || rawType === "float" || rawType === "number") type = "number";
          else if (rawType === "boolean") type = "boolean";
          else if (fName.toLowerCase().includes("email")) type = "email";
          else if (fName.toLowerCase().includes("name")) type = "fullName";
          else if (fName.toLowerCase().includes("date")) type = "date";

          fields.push({ name: fName, type });
        }
      });
    }
  }

  if (fields.length === 0) {
    fields.push({ name: "id", type: "uuid" });
    fields.push({ name: "name", type: "fullName" });
    fields.push({ name: "email", type: "email" });
    fields.push({ name: "created_at", type: "date" });
  }

  return { name, slug, fields };
}

/**
 * Parse TypeScript interface or type string into Mockbit Endpoint Spec & FieldDefinitions
 */
export function parseTypeScriptType(tsCode: string): {
  name: string;
  slug: string;
  fields: FieldDefinition[];
} {
  let name = "Imported TypeScript Type";
  let slug = "ts-endpoint";
  const fields: FieldDefinition[] = [];

  const nameMatch = tsCode.match(/(?:interface|type)\s+([a-zA-Z0-9_]+)/i);
  if (nameMatch && nameMatch[1]) {
    name = `${nameMatch[1]} API`;
    slug = nameMatch[1].toLowerCase().replace(/[^a-z0-9]/g, "-");
  }

  const blockMatch = tsCode.match(/\{([^}]+)\}/);
  if (blockMatch && blockMatch[1]) {
    const lines = blockMatch[1].split("\n").map((l) => l.trim()).filter(Boolean);
    lines.forEach((line) => {
      const fieldMatch = line.match(/^([a-zA-Z0-9_]+)\??\s*:\s*(.+?);?$/);
      if (fieldMatch) {
        const fName = fieldMatch[1];
        const rawType = fieldMatch[2].trim();
        const lowerRaw = rawType.toLowerCase();

        let type: FieldDefinition["type"] = "lorem";
        let options: string[] | undefined = undefined;

        if (rawType.includes("|") && (rawType.includes("'") || rawType.includes('"'))) {
          type = "enum";
          options = rawType
            .split("|")
            .map((opt) => opt.trim().replace(/['"]/g, ""))
            .filter(Boolean);
        } else if (lowerRaw.includes("number")) {
          type = "number";
        } else if (lowerRaw.includes("boolean")) {
          type = "boolean";
        } else if (fName.toLowerCase().includes("id")) {
          type = "uuid";
        } else if (fName.toLowerCase().includes("email")) {
          type = "email";
        } else if (fName.toLowerCase().includes("name")) {
          type = "fullName";
        } else if (fName.toLowerCase().includes("date")) {
          type = "date";
        }

        fields.push({ name: fName, type, options });
      }
    });
  }

  if (fields.length === 0) {
    fields.push({ name: "id", type: "uuid" });
    fields.push({ name: "name", type: "fullName" });
    fields.push({ name: "email", type: "email" });
    fields.push({ name: "created_at", type: "date" });
  }

  return { name, slug, fields };
}

/**
 * Parse W3C/IETF JSON Schema (v4/v7/2020-12) string into Mockbit Endpoint Spec & FieldDefinitions
 */
export function parseJsonSchemaSpec(jsonString: string): {
  name: string;
  slug: string;
  fields: FieldDefinition[];
} {
  const schemaObj = JSON.parse(jsonString);

  let title = schemaObj.title || "Imported JSON Schema";
  let slug = title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  if (!slug || slug === "-") slug = "json-schema-endpoint";

  const fields: FieldDefinition[] = [];
  const props = schemaObj.properties || {};

  Object.entries(props).forEach(([key, val]: [string, any]) => {
    let type: FieldDefinition["type"] = "lorem";
    let options: string[] | undefined = undefined;

    if (val.enum && Array.isArray(val.enum)) {
      type = "enum";
      options = val.enum.map((opt: any) => String(opt));
    } else if (val.format === "uuid" || key.toLowerCase().includes("id")) {
      type = "uuid";
    } else if (val.format === "email" || key.toLowerCase().includes("email")) {
      type = "email";
    } else if (val.format === "date" || val.format === "date-time" || key.toLowerCase().includes("date")) {
      type = "date";
    } else if (val.type === "number" || val.type === "integer") {
      type = "number";
    } else if (val.type === "boolean") {
      type = "boolean";
    } else if (key.toLowerCase().includes("name")) {
      type = "fullName";
    }

    fields.push({ name: key, type, options });
  });

  if (fields.length === 0) {
    fields.push({ name: "id", type: "uuid" });
    fields.push({ name: "name", type: "fullName" });
    fields.push({ name: "email", type: "email" });
    fields.push({ name: "created_at", type: "date" });
  }

  return { name: `${title} API`, slug, fields };
}

/**
 * Parse Google Protocol Buffers (.proto) string into Mockbit Endpoint Spec & FieldDefinitions
 */
export function parseProtobufSchema(protoText: string): {
  name: string;
  slug: string;
  fields: FieldDefinition[];
} {
  let name = "Imported Protobuf gRPC API";
  let slug = "grpc-endpoint";
  const fields: FieldDefinition[] = [];

  const messageMatch = protoText.match(/message\s+([a-zA-Z0-9_]+)\s*\{/i);
  if (messageMatch && messageMatch[1]) {
    name = `${messageMatch[1]} gRPC API`;
    slug = messageMatch[1].toLowerCase().replace(/[^a-z0-9]/g, "-");
  }

  // Extract enum definitions for option extraction
  const enumOptionsMap: Record<string, string[]> = {};
  const enumMatches = Array.from(protoText.matchAll(/enum\s+([a-zA-Z0-9_]+)\s*\{([^}]+)\}/gi));
  enumMatches.forEach((m) => {
    const enumName = m[1];
    const enumBody = m[2];
    const opts = Array.from(enumBody.matchAll(/([a-zA-Z0-9_]+)\s*=\s*\d+;/g)).map((x) => x[1]);
    if (opts.length > 0) enumOptionsMap[enumName] = opts;
  });

  const blockMatch = protoText.match(/message\s+[a-zA-Z0-9_]+\s*\{([^}]+)\}/i);
  if (blockMatch && blockMatch[1]) {
    const lines = blockMatch[1].split("\n").map((l) => l.trim()).filter(Boolean);
    lines.forEach((line) => {
      const fieldMatch = line.match(/^(?:repeated\s+)?([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)\s*=\s*\d+;/);
      if (fieldMatch) {
        const rawType = fieldMatch[1];
        const fName = fieldMatch[2];
        const lowerType = rawType.toLowerCase();

        let type: FieldDefinition["type"] = "lorem";
        let options: string[] | undefined = undefined;

        if (enumOptionsMap[rawType]) {
          type = "enum";
          options = enumOptionsMap[rawType];
        } else if (["double", "float", "int32", "int64", "uint32", "sint32", "fixed32"].includes(lowerType)) {
          type = "number";
        } else if (lowerType === "bool") {
          type = "boolean";
        } else if (fName.toLowerCase().includes("id")) {
          type = "uuid";
        } else if (fName.toLowerCase().includes("email")) {
          type = "email";
        } else if (fName.toLowerCase().includes("name")) {
          type = "fullName";
        } else if (fName.toLowerCase().includes("date")) {
          type = "date";
        }

        fields.push({ name: fName, type, options });
      }
    });
  }

  if (fields.length === 0) {
    fields.push({ name: "id", type: "uuid" });
    fields.push({ name: "name", type: "fullName" });
    fields.push({ name: "email", type: "email" });
    fields.push({ name: "created_at", type: "date" });
  }

  return { name, slug, fields };
}
