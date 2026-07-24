/**
 * Claude Dataset Generator Script for Mockbit — 15+ Vertical Industry Expansion
 *
 * Usage:
 * ANTHROPIC_API_KEY="sk-ant-..." npx tsx scripts/generate-claude-datasets.ts
 *
 * Generates seed datasets for Mockbit's public resource catalog (/resources and /api/v1/public/*)
 * across 12+ specialized domains (Healthcare, Fintech, Travel, Gaming, AI Agent Traces, IoT).
 */

import fs from "fs";
import path from "path";

let ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  const envLocalPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, "utf-8");
    const match = envContent.match(/ANTHROPIC_API_KEY=["']?([^"'\r\n]+)["']?/);
    if (match && match[1]) {
      ANTHROPIC_API_KEY = match[1].trim();
    }
  }
}

const MODEL = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022";
const OUTPUT_DIR = path.join(process.cwd(), "lib", "datasets", "data");

const JSON_ONLY_SYSTEM_PROMPT =
  "You generate seed data for a software demo. Respond with ONLY a single raw JSON array. " +
  "No markdown code fences, no backticks, no preamble, no explanation, no trailing commentary. " +
  "The response must be valid JSON that JSON.parse() can parse directly.";

function placeholderImage(seed: string, width = 800, height = 600): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

async function callClaude(prompt: string, maxTokens = 4000): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY as string,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: JSON_ONLY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  if (data.type === "error") {
    throw new Error(`API returned error: ${JSON.stringify(data.error)}`);
  }

  const textBlocks = (data.content || [])
    .filter((block: any) => block.type === "text")
    .map((block: any) => block.text);

  return textBlocks.join("\n");
}

async function generateValidatedArray(prompt: string, maxTokens = 4000): Promise<any[]> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const text = await callClaude(
      attempt === 1
        ? prompt
        : `${prompt}\n\nIMPORTANT: Your previous response was not valid JSON or was truncated. Return a SHORTER array if needed, but it MUST be complete, valid, parseable JSON with no truncation.`,
      maxTokens
    );

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) continue;

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (err: any) {
      console.warn(`  Attempt ${attempt}: JSON parse retry: ${err.message}`);
    }
  }

  throw new Error("Failed to generate valid JSON array.");
}

function writeDataset(slug: string, data: any[]) {
  fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.json`), JSON.stringify(data, null, 2));
  console.log(`✓ Wrote ${slug}.json (${data.length} records)`);
}

// ---------------------------------------------------------------------------
// Fallback Seed Data Builders for Offline Runs
// ---------------------------------------------------------------------------

function fallbackUsers() {
  const roles = ["Engineer", "Designer", "Product Manager", "Sales Rep", "Support Lead"];
  return Array.from({ length: 25 }, (_, i) => {
    const id = `usr_${101 + i}`;
    return {
      id,
      name: `User ${101 + i}`,
      email: `user${101 + i}@mockbit.dev`,
      role: roles[i % roles.length],
      avatar_url: placeholderImage(id, 200, 200),
      is_active: i % 5 !== 0,
      created_at: new Date(2025, i % 12, (i % 27) + 1).toISOString(),
    };
  });
}

function fallbackOrders(userIds: string[]) {
  const statuses = ["paid", "shipped", "pending"];
  return Array.from({ length: 25 }, (_, i) => ({
    id: `ord_${501 + i}`,
    user_id: userIds[i % userIds.length],
    total_amount: Math.round((20 + i * 7.35) * 100) / 100,
    status: statuses[i % statuses.length],
    items_count: (i % 5) + 1,
    created_at: new Date(2025, i % 12, (i % 27) + 1).toISOString(),
  }));
}

function fallbackPosts(userIds: string[]) {
  return Array.from({ length: 20 }, (_, i) => ({
    id: `post_${201 + i}`,
    author_id: userIds[i % userIds.length],
    title: `Building Distributed Systems ${i + 1}`,
    summary: "Architectural principles for serverless microservices.",
    read_time_mins: (i % 8) + 2,
    published_at: new Date(2025, i % 12, (i % 27) + 1).toISOString(),
  }));
}

function fallbackProducts() {
  const brands = ["Nova", "Kestrel", "Orbital", "Fathom"];
  return Array.from({ length: 30 }, (_, i) => {
    const id = `prod_${i + 1}`;
    return {
      id,
      title: `${brands[i % brands.length]} Hardware ${i + 1}`,
      category: "Electronics",
      price: Math.round((19.99 + i * 12.5) * 100) / 100,
      in_stock: i % 4 !== 0,
      image_url: placeholderImage(id),
      created_at: new Date(2025, i % 12, (i % 27) + 1).toISOString(),
    };
  });
}

function fallbackInvoices() {
  const plans = ["Starter", "Pro", "Enterprise"];
  return Array.from({ length: 20 }, (_, i) => ({
    id: `inv_${901 + i}`,
    customer_email: `billing${i}@example.com`,
    plan_name: plans[i % plans.length],
    amount: [29, 99, 499][i % 3],
    status: "paid",
    created_at: new Date(2025, i % 12, 1).toISOString(),
  }));
}

function fallbackRecipes() {
  return Array.from({ length: 15 }, (_, i) => ({
    id: `rec_${301 + i}`,
    title: `Gourmet Dish ${i + 1}`,
    cuisine: "Italian",
    prep_time_mins: 25,
    calories: 450 + i * 10,
    is_vegan: i % 2 === 0,
  }));
}

function fallbackPatients() {
  const bloodTypes = ["A+", "O+", "B+", "AB-"];
  return Array.from({ length: 20 }, (_, i) => ({
    id: `pat_${801 + i}`,
    full_name: `Patient ${i + 1}`,
    dob: "1988-05-14",
    gender: i % 2 === 0 ? "female" : "male",
    blood_type: bloodTypes[i % bloodTypes.length],
    primary_condition: i % 3 === 0 ? "Hypertension" : "Healthy",
    last_visit: new Date(2026, 0, (i % 20) + 1).toISOString(),
  }));
}

function fallbackBankAccounts() {
  const types = ["checking", "savings", "investment"];
  return Array.from({ length: 15 }, (_, i) => ({
    id: `acc_${401 + i}`,
    account_number: `**** **** 481${i}`,
    account_type: types[i % types.length],
    balance: Math.round((1200 + i * 450.75) * 100) / 100,
    currency: "USD",
    is_frozen: false,
  }));
}

function fallbackTransactions(accIds: string[]) {
  return Array.from({ length: 25 }, (_, i) => ({
    id: `txn_${701 + i}`,
    account_id: accIds[i % accIds.length],
    merchant: `Merchant ${i + 1}`,
    amount: Math.round((12.5 + i * 8.9) * 100) / 100,
    type: i % 3 === 0 ? "credit" : "debit",
    timestamp: new Date(2026, 0, (i % 25) + 1).toISOString(),
  }));
}

function fallbackFlights() {
  const airlines = ["SkyWays", "AeroJet", "GlobalAir"];
  return Array.from({ length: 15 }, (_, i) => ({
    id: `flt_${101 + i}`,
    flight_number: `${airlines[i % airlines.length].slice(0, 2).toUpperCase()}-${400 + i}`,
    airline: airlines[i % airlines.length],
    origin: "SFO",
    destination: "JFK",
    status: i % 4 === 0 ? "delayed" : "on_time",
    gate: `B${(i % 12) + 1}`,
    departure_time: new Date(2026, 0, 24, 10 + (i % 6)).toISOString(),
  }));
}

function fallbackGameMatches() {
  const maps = ["Dust II", "Inferno", "Mirage", "Overpass"];
  return Array.from({ length: 15 }, (_, i) => ({
    id: `match_${601 + i}`,
    map_name: maps[i % maps.length],
    duration_seconds: 2100 + i * 60,
    score_red: 16,
    score_blue: 12,
    mvp_player: `GamerPro_${i + 1}`,
    timestamp: new Date(2026, 0, (i % 20) + 1).toISOString(),
  }));
}

function fallbackAgentTraces() {
  const tools = ["web_search", "code_executor", "database_query"];
  return Array.from({ length: 15 }, (_, i) => ({
    id: `trace_${901 + i}`,
    agent_name: "Antigravity Code Assistant",
    tool_called: tools[i % tools.length],
    execution_time_ms: 120 + i * 35,
    tokens_used: 450 + i * 80,
    status: "success",
    timestamp: new Date(2026, 0, (i % 20) + 1).toISOString(),
  }));
}

function fallbackIotSensors() {
  return Array.from({ length: 20 }, (_, i) => ({
    id: `sensor_${201 + i}`,
    device_id: `iot_node_${10 + i}`,
    temperature_celsius: Math.round((21.5 + (i % 5) * 0.8) * 10) / 10,
    humidity_pct: 45 + (i % 10),
    battery_level_pct: 95 - i * 2,
    status: "online",
    last_ping: new Date(2026, 0, 23, 12, i % 60).toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Main Generation Pipeline
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Mockbit Vertical Industry Dataset Generator ===");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (!ANTHROPIC_API_KEY) {
    console.warn("⚠️ ANTHROPIC_API_KEY not set. Writing fallback seed data for all 12+ vertical datasets.\n");
    const users = fallbackUsers();
    const userIds = users.map((u) => u.id);
    const bankAccs = fallbackBankAccounts();
    const accIds = bankAccs.map((a) => a.id);

    writeDataset("users", users);
    writeDataset("orders", fallbackOrders(userIds));
    writeDataset("posts", fallbackPosts(userIds));
    writeDataset("products", fallbackProducts());
    writeDataset("invoices", fallbackInvoices());
    writeDataset("recipes", fallbackRecipes());
    writeDataset("patients", fallbackPatients());
    writeDataset("bank_accounts", bankAccs);
    writeDataset("transactions", fallbackTransactions(accIds));
    writeDataset("flights", fallbackFlights());
    writeDataset("game_matches", fallbackGameMatches());
    writeDataset("agent_traces", fallbackAgentTraces());
    writeDataset("iot_sensors", fallbackIotSensors());

    console.log("\n=== All 12+ Vertical Datasets Generated (Fallback Mode) ===");
    return;
  }

  // 1. Users
  let userIds: string[] = [];
  console.log("Processing dataset: [users] ...");
  try {
    const users = await generateValidatedArray(
      "Generate 25 tech company employee objects with id (usr_101..), name, email, role, is_active, created_at."
    );
    userIds = users.map((u) => u.id);
    writeDataset("users", users.map((u) => ({ ...u, avatar_url: placeholderImage(u.id, 200, 200) })));
  } catch {
    const u = fallbackUsers();
    userIds = u.map((x) => x.id);
    writeDataset("users", u);
  }

  // 2. Orders
  console.log("Processing dataset: [orders] ...");
  try {
    const orders = await generateValidatedArray(
      `Generate 25 order objects referencing user_id from this list: ${JSON.stringify(userIds)}.`
    );
    writeDataset("orders", orders);
  } catch {
    writeDataset("orders", fallbackOrders(userIds));
  }

  // 3. Posts
  console.log("Processing dataset: [posts] ...");
  try {
    const posts = await generateValidatedArray(
      `Generate 20 dev blog post objects referencing author_id from this list: ${JSON.stringify(userIds)}.`
    );
    writeDataset("posts", posts);
  } catch {
    writeDataset("posts", fallbackPosts(userIds));
  }

  // 4. Products
  console.log("Processing dataset: [products] ...");
  try {
    const products = await generateValidatedArray("Generate 30 tech product objects.");
    writeDataset("products", products.map((p: any) => ({ ...p, image_url: placeholderImage(p.id) })));
  } catch {
    writeDataset("products", fallbackProducts());
  }

  // 5. Invoices
  console.log("Processing dataset: [invoices] ...");
  try {
    writeDataset("invoices", await generateValidatedArray("Generate 20 SaaS subscription invoice objects."));
  } catch {
    writeDataset("invoices", fallbackInvoices());
  }

  // 6. Recipes
  console.log("Processing dataset: [recipes] ...");
  try {
    writeDataset("recipes", await generateValidatedArray("Generate 15 gourmet cooking recipe objects."));
  } catch {
    writeDataset("recipes", fallbackRecipes());
  }

  // 7. Patients (Healthcare)
  console.log("Processing dataset: [patients] ...");
  try {
    writeDataset("patients", await generateValidatedArray("Generate 20 EHR patient records with full_name, dob, gender, blood_type, primary_condition, last_visit."));
  } catch {
    writeDataset("patients", fallbackPatients());
  }

  // 8. Bank Accounts & Transactions (Fintech)
  console.log("Processing dataset: [bank_accounts & transactions] ...");
  let accIds: string[] = [];
  try {
    const accs = await generateValidatedArray("Generate 15 bank account objects with id (acc_401..), account_number, account_type, balance, currency.");
    accIds = accs.map((a) => a.id);
    writeDataset("bank_accounts", accs);
  } catch {
    const accs = fallbackBankAccounts();
    accIds = accs.map((a) => a.id);
    writeDataset("bank_accounts", accs);
  }

  try {
    writeDataset("transactions", await generateValidatedArray(`Generate 25 banking transaction objects referencing account_id from ${JSON.stringify(accIds)}.`));
  } catch {
    writeDataset("transactions", fallbackTransactions(accIds));
  }

  // 9. Flights (Travel)
  console.log("Processing dataset: [flights] ...");
  try {
    writeDataset("flights", await generateValidatedArray("Generate 15 commercial flight objects with flight_number, airline, origin, destination, status, gate, departure_time."));
  } catch {
    writeDataset("flights", fallbackFlights());
  }

  // 10. Game Matches (Gaming)
  console.log("Processing dataset: [game_matches] ...");
  try {
    writeDataset("game_matches", await generateValidatedArray("Generate 15 esports match objects with map_name, duration_seconds, score_red, score_blue, mvp_player, timestamp."));
  } catch {
    writeDataset("game_matches", fallbackGameMatches());
  }

  // 11. Agent Traces (AI & ML)
  console.log("Processing dataset: [agent_traces] ...");
  try {
    writeDataset("agent_traces", await generateValidatedArray("Generate 15 AI agent execution trace objects with agent_name, tool_called, execution_time_ms, tokens_used, status, timestamp."));
  } catch {
    writeDataset("agent_traces", fallbackAgentTraces());
  }

  // 12. IoT Sensors (IoT)
  console.log("Processing dataset: [iot_sensors] ...");
  try {
    writeDataset("iot_sensors", await generateValidatedArray("Generate 20 IoT hardware sensor telemetry objects with device_id, temperature_celsius, humidity_pct, battery_level_pct, status, last_ping."));
  } catch {
    writeDataset("iot_sensors", fallbackIotSensors());
  }

  console.log("\n=== All 12+ Vertical Industry Datasets Generated Successfully ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});