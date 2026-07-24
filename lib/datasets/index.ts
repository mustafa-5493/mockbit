import { EntityRelation } from "@/lib/mock-generator";

// Static Imports for all 13 Vertical Industry Datasets
import productsJson from "./data/products.json";
import usersJson from "./data/users.json";
import ordersJson from "./data/orders.json";
import invoicesJson from "./data/invoices.json";
import postsJson from "./data/posts.json";
import recipesJson from "./data/recipes.json";
import patientsJson from "./data/patients.json";
import bankAccountsJson from "./data/bank_accounts.json";
import transactionsJson from "./data/transactions.json";
import flightsJson from "./data/flights.json";
import gameMatchesJson from "./data/game_matches.json";
import agentTracesJson from "./data/agent_traces.json";
import iotSensorsJson from "./data/iot_sensors.json";

export interface PublicDataset {
  slug: string;
  name: string;
  category:
    | "E-Commerce"
    | "Users & SaaS"
    | "Content & Social"
    | "Fintech & Banking"
    | "Healthcare & EHR"
    | "Travel & Aviation"
    | "Gaming & Esports"
    | "AI & ML Agent Traces"
    | "IoT & Telemetry"
    | "Health & Food";
  description: string;
  itemCount: number;
  relations?: EntityRelation[];
  records: Record<string, any>[];
}

// ---------------------------------------------------------------------------
// 13+ Specialized Vertical Industry Datasets
// ---------------------------------------------------------------------------
export const PUBLIC_DATASETS: PublicDataset[] = [
  {
    slug: "products",
    name: "Products & E-Commerce Catalog",
    category: "E-Commerce",
    description: "Consumer electronics, accessories, and tech hardware items with pricing and ratings.",
    itemCount: Array.isArray(productsJson) ? productsJson.length : 30,
    records: Array.isArray(productsJson) ? productsJson : [],
  },
  {
    slug: "users",
    name: "User Profiles & Employees",
    category: "Users & SaaS",
    description: "Realistic tech company team profiles with avatars, department roles, and location info.",
    itemCount: Array.isArray(usersJson) ? usersJson.length : 25,
    records: Array.isArray(usersJson) ? usersJson : [],
  },
  {
    slug: "orders",
    name: "Orders & Transactions",
    category: "E-Commerce",
    description: "Relational customer order transactions linked to users via user_id foreign key.",
    itemCount: Array.isArray(ordersJson) ? ordersJson.length : 25,
    relations: [
      {
        id: "rel_order_user",
        targetEndpoint: "users",
        foreignKey: "user_id",
        targetKey: "id",
        type: "belongsTo",
        onDelete: "cascade",
      },
    ],
    records: Array.isArray(ordersJson) ? ordersJson : [],
  },
  {
    slug: "invoices",
    name: "SaaS Invoices & Subscriptions",
    category: "Fintech & Banking",
    description: "Stripe-style SaaS recurring subscription billing records with payment status.",
    itemCount: Array.isArray(invoicesJson) ? invoicesJson.length : 20,
    records: Array.isArray(invoicesJson) ? invoicesJson : [],
  },
  {
    slug: "bank_accounts",
    name: "Bank Accounts & Ledger",
    category: "Fintech & Banking",
    description: "Plaid-style open banking accounts with checking, savings, and investment balances.",
    itemCount: Array.isArray(bankAccountsJson) ? bankAccountsJson.length : 15,
    records: Array.isArray(bankAccountsJson) ? bankAccountsJson : [],
  },
  {
    slug: "transactions",
    name: "Banking Transactions",
    category: "Fintech & Banking",
    description: "Relational credit & debit card transactions linked to bank_accounts via account_id.",
    itemCount: Array.isArray(transactionsJson) ? transactionsJson.length : 25,
    relations: [
      {
        id: "rel_txn_account",
        targetEndpoint: "bank_accounts",
        foreignKey: "account_id",
        targetKey: "id",
        type: "belongsTo",
        onDelete: "cascade",
      },
    ],
    records: Array.isArray(transactionsJson) ? transactionsJson : [],
  },
  {
    slug: "patients",
    name: "Healthcare Patients & EHR",
    category: "Healthcare & EHR",
    description: "HL7 FHIR compliant patient medical records with blood types and primary conditions.",
    itemCount: Array.isArray(patientsJson) ? patientsJson.length : 20,
    records: Array.isArray(patientsJson) ? patientsJson : [],
  },
  {
    slug: "flights",
    name: "Flights & Flight Manifests",
    category: "Travel & Aviation",
    description: "Commercial airline flight schedules, gate assignments, and delay statuses.",
    itemCount: Array.isArray(flightsJson) ? flightsJson.length : 15,
    records: Array.isArray(flightsJson) ? flightsJson : [],
  },
  {
    slug: "game_matches",
    name: "Esports & Game Matches",
    category: "Gaming & Esports",
    description: "Competitive multiplayer match logs with scores, map names, and MVP player stats.",
    itemCount: Array.isArray(gameMatchesJson) ? gameMatchesJson.length : 15,
    records: Array.isArray(gameMatchesJson) ? gameMatchesJson : [],
  },
  {
    slug: "agent_traces",
    name: "AI Agent Traces & Tool Calls",
    category: "AI & ML Agent Traces",
    description: "LLM execution logs with tool call names, token counts, and execution latency.",
    itemCount: Array.isArray(agentTracesJson) ? agentTracesJson.length : 15,
    records: Array.isArray(agentTracesJson) ? agentTracesJson : [],
  },
  {
    slug: "iot_sensors",
    name: "IoT Sensor Telemetry",
    category: "IoT & Telemetry",
    description: "Hardware telemetry metrics including temperature, humidity, and battery levels.",
    itemCount: Array.isArray(iotSensorsJson) ? iotSensorsJson.length : 20,
    records: Array.isArray(iotSensorsJson) ? iotSensorsJson : [],
  },
  {
    slug: "posts",
    name: "Developer Posts & Articles",
    category: "Content & Social",
    description: "Technical blog posts and articles linked to author user profiles via author_id.",
    itemCount: Array.isArray(postsJson) ? postsJson.length : 20,
    relations: [
      {
        id: "rel_post_author",
        targetEndpoint: "users",
        foreignKey: "author_id",
        targetKey: "id",
        type: "belongsTo",
      },
    ],
    records: Array.isArray(postsJson) ? postsJson : [],
  },
  {
    slug: "recipes",
    name: "Gourmet Recipes & Culinary",
    category: "Health & Food",
    description: "Culinary recipes dataset complete with ingredients, calories, and prep times.",
    itemCount: Array.isArray(recipesJson) ? recipesJson.length : 15,
    records: Array.isArray(recipesJson) ? recipesJson : [],
  },
];

export function getPublicDatasetBySlug(slug: string): PublicDataset | undefined {
  return PUBLIC_DATASETS.find((d) => d.slug.toLowerCase() === slug.toLowerCase());
}
