#!/usr/bin/env node

/**
 * Mockbit Standalone CLI (npx mockbit)
 * Zero-dependency local mock server runner.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { faker } from "@faker-js/faker";

// ANSI Color Codes for Terminal Output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
};

// State Store for CLI
const cliStore = new Map();

// Helper to parse arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let port = 4000;
  let file = null;
  let inlineSchema = null;
  let watch = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--port" || arg === "-p") {
      port = parseInt(args[++i], 10) || 4000;
    } else if (arg === "--schema" || arg === "-s") {
      inlineSchema = args[++i];
    } else if (arg === "--watch" || arg === "-w") {
      watch = true;
    } else if (!arg.startsWith("-") && !file) {
      file = arg;
    }
  }

  return { port, file, inlineSchema, watch };
}

// Generate simple mock value
function generateValueForType(type, keyName) {
  const lower = keyName.toLowerCase();
  if (lower.includes("email")) return faker.internet.email();
  if (lower.includes("name")) return faker.person.fullName();
  if (lower.includes("price") || lower.includes("amount") || lower.includes("total")) return `$${faker.finance.amount()}`;
  if (lower.includes("status")) return faker.helpers.arrayElement(["active", "pending", "completed"]);
  if (lower.includes("date") || lower.endsWith("_at")) return faker.date.past().toISOString();
  if (lower === "id" || lower.endsWith("_id")) return faker.string.uuid();
  if (typeof type === "boolean" || lower.startsWith("is_")) return faker.datatype.boolean();
  if (typeof type === "number") return faker.number.int({ min: 10, max: 999 });
  return faker.lorem.word();
}

// Generate Mock Data from File or Expression
function loadMockData(file, inlineSchema) {
  if (inlineSchema) {
    const fields = inlineSchema.split(",").map((s) => s.trim().split(":"));
    const list = [];
    for (let i = 0; i < 5; i++) {
      const obj = {};
      fields.forEach(([k, t]) => {
        const keyName = k.trim();
        obj[keyName] = generateValueForType(t || keyName, keyName);
      });
      list.push(obj);
    }
    return list;
  }

  if (file) {
    const filePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      console.error(`${colors.red}Error: File not found: ${filePath}${colors.reset}`);
      process.exit(1);
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);
    const template = Array.isArray(json) ? json[0] || {} : json;
    const keys = Object.keys(template);

    const list = [];
    for (let i = 0; i < 5; i++) {
      const obj = {};
      keys.forEach((key) => {
        obj[key] = generateValueForType(template[key], key);
      });
      list.push(obj);
    }
    return list;
  }

  // Default Orders sample
  return [
    { id: faker.string.uuid(), customer: "Sarah Connor", total: "$149.99", status: "shipped", created_at: faker.date.past().toISOString() },
    { id: faker.string.uuid(), customer: "Alex Rivera", total: "$299.50", status: "pending", created_at: faker.date.past().toISOString() },
    { id: faker.string.uuid(), customer: "John Doe", total: "$45.00", status: "completed", created_at: faker.date.past().toISOString() },
  ];
}

// Run CLI Server
function startServer() {
  const { port, file, inlineSchema, watch } = parseArgs();
  const endpointName = file ? path.basename(file, path.extname(file)) : "users";

  let initialData = loadMockData(file, inlineSchema);
  cliStore.set(endpointName, [...initialData]);

  // File Watcher
  if (watch && file) {
    const filePath = path.resolve(process.cwd(), file);
    fs.watch(filePath, () => {
      console.log(`\n${colors.yellow}⚡ File changed. Reloading mock data...${colors.reset}`);
      try {
        initialData = loadMockData(file, inlineSchema);
        cliStore.set(endpointName, [...initialData]);
      } catch (err) {
        console.error(`${colors.red}Failed to reload file: ${err.message}${colors.reset}`);
      }
    });
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const pathname = url.pathname;
    const method = req.method.toUpperCase();

    // CORS Headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    const segments = pathname.split("/").filter(Boolean);
    const targetResource = segments[0] || endpointName;
    const resourceId = segments[1];

    let store = cliStore.get(targetResource) || cliStore.get(endpointName) || [];

    let statusCode = 200;
    let responseData = null;

    if (method === "GET") {
      if (resourceId) {
        responseData = store.find((item) => String(item.id) === resourceId) || { error: "Not found", id: resourceId };
        statusCode = responseData.error ? 404 : 200;
      } else {
        responseData = store;
      }
    } else if (method === "POST") {
      let bodyStr = "";
      req.on("data", (chunk) => (bodyStr += chunk));
      req.on("end", () => {
        let body = {};
        try {
          body = JSON.parse(bodyStr);
        } catch {}
        if (!body.id) body.id = faker.string.uuid();
        if (!body.created_at) body.created_at = new Date().toISOString();
        store.push(body);
        cliStore.set(targetResource, store);
        res.statusCode = 201;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(body, null, 2));
      });
      return;
    } else if (method === "DELETE") {
      if (resourceId) {
        store = store.filter((item) => String(item.id) !== resourceId);
        cliStore.set(targetResource, store);
        responseData = { message: "Resource deleted", id: resourceId };
      } else {
        cliStore.set(targetResource, []);
        responseData = { message: "Store cleared" };
      }
    } else {
      responseData = store;
    }

    // Log request
    const methodColor = method === "GET" ? colors.green : method === "POST" ? colors.cyan : colors.yellow;
    console.log(`${colors.dim}${new Date().toLocaleTimeString()}${colors.reset} ${methodColor}${method}${colors.reset} ${pathname} ${colors.bright}${statusCode}${colors.reset}`);

    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(responseData, null, 2));
  });

  server.listen(port, () => {
    console.clear();
    console.log(`
${colors.bright}${colors.cyan}⚡ Mockbit CLI v0.6${colors.reset}
${colors.dim}Local-First Mock Server Engine${colors.reset}

${colors.green}✓ Listening on:${colors.reset} ${colors.bright}http://localhost:${port}/${endpointName}${colors.reset}

${colors.dim}Available HTTP Routes:${colors.reset}
  ${colors.green}GET${colors.reset}    http://localhost:${port}/${endpointName}
  ${colors.green}GET${colors.reset}    http://localhost:${port}/${endpointName}/:id
  ${colors.cyan}POST${colors.reset}   http://localhost:${port}/${endpointName}
  ${colors.yellow}PUT${colors.reset}    http://localhost:${port}/${endpointName}/:id
  ${colors.yellow}PATCH${colors.reset}  http://localhost:${port}/${endpointName}/:id
  ${colors.red}DELETE${colors.reset} http://localhost:${port}/${endpointName}/:id

${colors.dim}Press Ctrl+C to stop${colors.reset}
--------------------------------------------------
`);
  });
}

startServer();
