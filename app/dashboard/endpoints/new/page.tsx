"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  generateMockResponse,
  inferFieldType,
  FieldDefinition,
  ConditionalRule,
  EntityRelation,
  ScenarioPreset,
  evaluateConditionalRuleDetailed,
  RuleEvaluationResult,
} from "@/lib/mock-generator";
import { parseOpenApiToFields, exportToCSV, exportToSQL, exportToXML, exportToOpenAPI, exportToPostman, exportToSqlTableDDL, exportToMarkdownDoc, exportToHtmlTestBench, MockEndpointSpec } from "@/lib/exporters";
import { SchemaRelationGraph } from "@/components/SchemaRelationGraph";
import { SdkGeneratorModal } from "@/components/SdkGeneratorModal";
import { DbSchemaImportModal } from "@/components/DbSchemaImportModal";
import { MockApiImportModal } from "@/components/MockApiImportModal";
import { CsvSchemaImportModal } from "@/components/CsvSchemaImportModal";
import { ProxyRecorderModal } from "@/components/ProxyRecorderModal";
import { RequestInspectorModal } from "@/components/RequestInspectorModal";
import { CodeSnippetModal } from "@/components/CodeSnippetModal";
import { ContextualEchoToolbar } from "@/components/ContextualEchoToolbar";
import { PostmanImportModal } from "@/components/PostmanImportModal";
import { CurlImportModal } from "@/components/CurlImportModal";
import { InsomniaImportModal } from "@/components/InsomniaImportModal";
import { HarImportModal } from "@/components/HarImportModal";
import { WireMockImportModal } from "@/components/WireMockImportModal";
import { GraphQLSdlImportModal } from "@/components/GraphQLSdlImportModal";
import { TypeScriptImportModal } from "@/components/TypeScriptImportModal";
import { JsonSchemaImportModal } from "@/components/JsonSchemaImportModal";
import { ProtobufImportModal } from "@/components/ProtobufImportModal";
import { UnifiedImportModal, ImportFormatId } from "@/components/UnifiedImportModal";
import { UnifiedExportModal, ExportFormatId } from "@/components/UnifiedExportModal";
import { StudioCommandPalette } from "@/components/StudioCommandPalette";
import { WebhookTriggerModal } from "@/components/WebhookTriggerModal";
import { WebSocketTestModal } from "@/components/WebSocketTestModal";
import { CalloutRuleBuilderModal } from "@/components/CalloutRuleBuilderModal";
import { ParsedTableSchema } from "@/lib/schema-introspector";
import {
  ArrowLeft,
  Share2,
  Upload,
  Code2,
  ListPlus,
  Plus,
  Trash2,
  RefreshCw,
  FileJson,
  CheckCircle2,
  Loader2,
  Sliders,
  Send,
  Play,
  Terminal,
  GitBranch,
  Link as LinkIcon,
  User,
  ShoppingCart,
  CreditCard,
  Package,
  Eye,
  EyeOff,
  Sparkles,
  ChevronUp,
  ChevronDown,
  GripVertical,
  FileText,
  Search,
  Download,
  Wand2,
  Activity,
  Database,
  FileSpreadsheet,
  Radio,
  Settings,
  X,
  Lock,
  Zap,
} from "lucide-react";

const FAKER_TYPE_OPTIONS: { label: string; value: FieldDefinition["type"] }[] = [
  { label: "UUID / ID", value: "uuid" },
  { label: "Full Name", value: "fullName" },
  { label: "First Name", value: "firstName" },
  { label: "Last Name", value: "lastName" },
  { label: "Email Address", value: "email" },
  { label: "Phone Number", value: "phone" },
  { label: "Avatar Image URL", value: "avatar" },
  { label: "Address", value: "address" },
  { label: "City", value: "city" },
  { label: "Country", value: "country" },
  { label: "Zip Code", value: "zipCode" },
  { label: "Company Name", value: "company" },
  { label: "Job Title", value: "jobTitle" },
  { label: "Date / Timestamp", value: "date" },
  { label: "Future Date", value: "futureDate" },
  { label: "Number (Integer)", value: "number" },
  { label: "Boolean (true/false)", value: "boolean" },
  { label: "Currency Amount ($)", value: "currency" },
  { label: "Enum Options", value: "enum" },
  { label: "Sentence / Text", value: "lorem" },
  { label: "URL Link", value: "url" },
  { label: "IP Address", value: "ip" },
  { label: "MAC Address", value: "mac" },
  { label: "US SSN / Medicare ID", value: "ssn" },
  { label: "Bcrypt Password Hash", value: "bcrypt" },
  { label: "Mustache / Echo Template ({{params.id}}, {{person.firstName}})", value: "template" },
];

const QUICKSTART_TEMPLATES = [
  {
    id: "users",
    name: "Users REST API",
    slug: "users",
    icon: User,
    responseType: "array" as const,
    arrayLength: 5,
    fields: [
      { name: "id", type: "uuid" as const },
      { name: "name", type: "fullName" as const },
      { name: "email", type: "email" as const },
      { name: "job_title", type: "jobTitle" as const },
      { name: "company", type: "company" as const },
      { name: "created_at", type: "date" as const },
    ],
  },
  {
    id: "orders",
    name: "E-Commerce Orders",
    slug: "orders",
    icon: ShoppingCart,
    responseType: "array" as const,
    arrayLength: 5,
    fields: [
      { name: "id", type: "uuid" as const },
      { name: "customer_name", type: "fullName" as const },
      { name: "total_amount", type: "currency" as const },
      { name: "status", type: "enum" as const, options: ["active", "shipped", "pending"] },
      { name: "is_paid", type: "boolean" as const },
      { name: "created_at", type: "date" as const },
    ],
  },
  {
    id: "checkout",
    name: "Payment Checkout",
    slug: "checkout",
    icon: CreditCard,
    responseType: "object" as const,
    arrayLength: 1,
    fields: [
      { name: "id", type: "uuid" as const },
      { name: "amount", type: "currency" as const },
      { name: "status", type: "enum" as const, options: ["succeeded", "processing", "requires_payment_method"] },
      { name: "card_brand", type: "enum" as const, options: ["visa", "mastercard", "amex"] },
      { name: "created_at", type: "date" as const },
    ],
  },
  {
    id: "products",
    name: "Products Catalog",
    slug: "products",
    icon: Package,
    responseType: "array" as const,
    arrayLength: 6,
    fields: [
      { name: "id", type: "uuid" as const },
      { name: "title", type: "company" as const },
      { name: "price", type: "currency" as const },
      { name: "category", type: "enum" as const, options: ["electronics", "apparel", "home"] },
      { name: "in_stock", type: "boolean" as const },
      { name: "rating", type: "number" as const },
    ],
  },
];

function NewEndpointForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Navigation & Studio UX State
  const [studioTab, setStudioTab] = useState<"schema" | "behavior" | "relations">("schema");
  const [showPreviewPanel, setShowPreviewPanel] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    }).catch(() => {});
  }, []);

  // Form Metadata State
  const [name, setName] = useState("Orders API");
  const [slug, setSlug] = useState("orders");
  const [mode, setMode] = useState<"manual" | "json" | "openapi">("manual");

  // Configuration Bar State
  const [responseType, setResponseType] = useState<"object" | "array">("array");
  const [arrayLength, setArrayLength] = useState<number>(5);
  const [statusCode, setStatusCode] = useState<number>(200);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [seed, setSeed] = useState<number | "">("");
  const [errorRate, setErrorRate] = useState<number>(0);
  const [errorStatus, setErrorStatus] = useState<number>(500);
  const [latencyJitterMin, setLatencyJitterMin] = useState<number>(0);
  const [latencyJitterMax, setLatencyJitterMax] = useState<number>(0);
  const [flakyErrorStatuses, setFlakyErrorStatuses] = useState<number[]>([500, 503]);
  const [simulateTimeout, setSimulateTimeout] = useState<boolean>(false);
  const [locale, setLocale] = useState<string>("en");

  // Weighted Responses State (Neutralizer Phase)
  const [enableWeighted, setEnableWeighted] = useState<boolean>(false);
  const [weightedResponses, setWeightedResponses] = useState<Array<{ id: string; weight: number; status: number }>>([
    { id: "variant_success", weight: 95, status: 200 },
    { id: "variant_failure", weight: 5, status: 500 },
  ]);

  // Conditional Rules & Relations State
  const [rules, setRules] = useState<ConditionalRule[]>([]);
  const [relations, setRelations] = useState<EntityRelation[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioPreset[]>([]);

  // Unified Modals & Command Palette State (UI/UX Redesign Phase)
  const [showUnifiedImportModal, setShowUnifiedImportModal] = useState(false);
  const [showUnifiedExportModal, setShowUnifiedExportModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showWebSocketModal, setShowWebSocketModal] = useState(false);
  const [showCalloutRuleModal, setShowCalloutRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ConditionalRule | undefined>(undefined);

  // Left Panel Redesign States (Zone A & Zone B)
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [showTemplatePopover, setShowTemplatePopover] = useState(false);

  // DB Schema Introspector Modal State (Mockbit Twin Phase 0)
  const [showDbImportModal, setShowDbImportModal] = useState(false);
  const [showMockApiModal, setShowMockApiModal] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [showCodeSnippetModal, setShowCodeSnippetModal] = useState(false);
  const [showPostmanImportModal, setShowPostmanImportModal] = useState(false);
  const [showCurlImportModal, setShowCurlImportModal] = useState(false);
  const [showInsomniaImportModal, setShowInsomniaImportModal] = useState(false);
  const [showHarImportModal, setShowHarImportModal] = useState(false);
  const [showWireMockImportModal, setShowWireMockImportModal] = useState(false);
  const [showGraphQLSdlImportModal, setShowGraphQLSdlImportModal] = useState(false);
  const [showTypeScriptImportModal, setShowTypeScriptImportModal] = useState(false);
  const [showJsonSchemaImportModal, setShowJsonSchemaImportModal] = useState(false);
  const [showProtobufImportModal, setShowProtobufImportModal] = useState(false);

  const handleSelectImportFormat = (formatId: ImportFormatId) => {
    switch (formatId) {
      case "openapi": handleImportOpenApi(); break;
      case "postman": setShowPostmanImportModal(true); break;
      case "curl": setShowCurlImportModal(true); break;
      case "insomnia": setShowInsomniaImportModal(true); break;
      case "har": setShowHarImportModal(true); break;
      case "wiremock": setShowWireMockImportModal(true); break;
      case "graphql": setShowGraphQLSdlImportModal(true); break;
      case "typescript": setShowTypeScriptImportModal(true); break;
      case "jsonschema": setShowJsonSchemaImportModal(true); break;
      case "protobuf": setShowProtobufImportModal(true); break;
      case "csv": setShowCsvImportModal(true); break;
      case "db": setShowDbImportModal(true); break;
      case "proxy": setShowProxyModal(true); break;
      case "mockapi": setShowMockApiModal(true); break;
    }
  };

  const handleSelectExportFormat = (exportId: ExportFormatId) => {
    switch (exportId) {
      case "openapi": handleExportOpenApiFile(); break;
      case "postman": handleExportPostmanFile(); break;
      case "markdown": handleExportMarkdownDocsFile(); break;
      case "html_runner": handleExportHtmlTestBenchFile(); break;
      case "sql_ddl": handleExportSqlDdlFile(); break;
      case "data_export": handleExportCsvFile(); break;
      case "sdk_code": setShowSdkModal(true); break;
    }
  };

  const handleImportDbSchemas = (schemas: ParsedTableSchema[], importMode: "replace" | "merge") => {
    if (schemas.length === 0) return;

    if (importMode === "replace") {
      const mainTable = schemas[0];
      setName(mainTable.name);
      setSlug(mainTable.slug);
      setResponseType(mainTable.responseType);
      setArrayLength(mainTable.arrayLength);
      setFields(mainTable.fields);

      const allRelations = schemas.flatMap((s) => s.relations);
      setRelations(allRelations);
    } else {
      // Merge mode
      const mainTable = schemas[0];
      setFields((prev) => [...prev, ...mainTable.fields]);
      const allRelations = schemas.flatMap((s) => s.relations);
      setRelations((prev) => [...prev, ...allRelations]);
    }
  };

  // Right Column View Mode: "preview" | "simulator"
  const [rightColTab, setRightColTab] = useState<"preview" | "simulator">("simulator");

  // Simulator Inputs State
  const [simMethod, setSimMethod] = useState<string>("GET");
  const [simHeaderKey, setSimHeaderKey] = useState<string>("authorization");
  const [simHeaderVal, setSimHeaderVal] = useState<string>("");
  const [simQueryKey, setSimQueryKey] = useState<string>("page");
  const [simQueryVal, setSimQueryVal] = useState<string>("");
  const [simBody, setSimBody] = useState<string>(JSON.stringify({ email: "taken@test.com" }, null, 2));

  // Read URL Search Parameters (for Simulator navigation or Share Links)
  useEffect(() => {
    if (searchParams) {
      const schemaB64 = searchParams.get("schema");
      if (schemaB64) {
        try {
          const parsed = JSON.parse(decodeURIComponent(atob(schemaB64)));
          if (parsed.name) setName(parsed.name);
          if (parsed.slug) setSlug(parsed.slug);
          if (parsed.responseType) setResponseType(parsed.responseType);
          if (parsed.arrayLength) setArrayLength(parsed.arrayLength);
          if (Array.isArray(parsed.fields)) setFields(parsed.fields);
          if (Array.isArray(parsed.rules)) setRules(parsed.rules);
          if (Array.isArray(parsed.relations)) setRelations(parsed.relations);
        } catch (e) {
          console.error("Failed to decode schema parameter", e);
        }
      }

      const method = searchParams.get("simMethod");
      const hKey = searchParams.get("simHeaderKey");
      const hVal = searchParams.get("simHeaderVal");
      const qKey = searchParams.get("simQueryKey");
      const qVal = searchParams.get("simQueryVal");
      const body = searchParams.get("simBody");

      if (method) setSimMethod(method);
      if (hKey) setSimHeaderKey(hKey);
      if (hVal) setSimHeaderVal(hVal);
      if (qKey) setSimQueryKey(qKey);
      if (qVal) setSimQueryVal(qVal);
      if (body) setSimBody(body);
      if (method || hKey || qKey || body) {
        setRightColTab("simulator");
      }
    }
  }, [searchParams]);

  // Simulator Results State
  const [simDiagnosticResult, setSimDiagnosticResult] = useState<{
    matched: boolean;
    ruleIndex?: number;
    matchedRule?: ConditionalRule;
    reason?: string;
    statusCode: number;
    responseOutput: any;
  } | null>(null);

  // Mode A: JSON Paste
  const [rawJsonSample, setRawJsonSample] = useState(
    JSON.stringify(
      {
        id: "ord_9824a",
        customer_name: "Sarah Connor",
        email: "sarah@cyberdyne.com",
        total: 149.99,
        status: "shipped",
        is_paid: true,
      },
      null,
      2
    )
  );

  // Mode B: Manual Fields
  const [fields, setFields] = useState<FieldDefinition[]>([
    { name: "id", type: "uuid" },
    { name: "customer_name", type: "fullName" },
    { name: "email", type: "email" },
    { name: "total_amount", type: "currency" },
    { name: "status", type: "enum", options: ["active", "shipped", "pending"] },
    { name: "created_at", type: "date" },
    { name: "is_paid", type: "boolean" },
  ]);

  // Mode C: OpenAPI Spec Paste
  const [rawOpenApi, setRawOpenApi] = useState(`{
  "openapi": "3.0.0",
  "info": { "title": "Products API", "version": "1.0.0" },
  "paths": {
    "/products": {
      "get": {
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": { "type": "string", "format": "uuid" },
                      "name": { "type": "string" },
                      "price": { "type": "number" },
                      "is_available": { "type": "boolean" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`);

  // Live Output Preview
  const [previewOutput, setPreviewOutput] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Update preview whenever fields or config change
  useEffect(() => {
    generatePreview();
  }, [fields, responseType, arrayLength, mode, rawJsonSample, rawOpenApi, seed]);

  const generatePreview = () => {
    let schemaObj: any = { fields };

    if (mode === "json") {
      try {
        schemaObj = JSON.parse(rawJsonSample);
      } catch {
        schemaObj = { fields };
      }
    } else if (mode === "openapi") {
      try {
        const parsedFields = parseOpenApiToFields(rawOpenApi);
        schemaObj = { fields: parsedFields };
      } catch {
        schemaObj = { fields };
      }
    }

    const mockData = generateMockResponse(
      schemaObj,
      responseType,
      arrayLength,
      undefined,
      seed === "" ? undefined : Number(seed)
    );
    setPreviewOutput(mockData);
  };

  const handleApplyTemplate = (tmpl: typeof QUICKSTART_TEMPLATES[0]) => {
    setName(tmpl.name);
    setSlug(tmpl.slug);
    setResponseType(tmpl.responseType);
    setArrayLength(tmpl.arrayLength);
    setFields(tmpl.fields);
    setMode("manual");
  };

  const handleNameChange = (val: string) => {
    setName(val);
    const sanitized = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-");
    setSlug(sanitized || "endpoint");
  };

  const handleShareSchemaLink = () => {
    try {
      const payload = {
        name,
        slug,
        responseType,
        arrayLength,
        fields,
        rules,
        relations,
      };
      const b64 = btoa(encodeURIComponent(JSON.stringify(payload)));
      const url = `${window.location.origin}/dashboard/endpoints/new?schema=${b64}`;
      navigator.clipboard.writeText(url);
      alert("Shareable Studio URL copied to clipboard!");
    } catch {
      alert("Failed to generate share URL.");
    }
  };

  const handleExportSchemaFile = () => {
    const payload = {
      name,
      slug,
      response_type: responseType,
      array_length: arrayLength,
      status_code: statusCode,
      latency_ms: latencyMs,
      rules,
      relations,
      fields,
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mockbit-${slug || "schema"}.json`;
    URL.revokeObjectURL(url);
  };

  const [showSdkModal, setShowSdkModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleGenerateFromAiPrompt = () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setTimeout(() => {
      const q = aiPrompt.toLowerCase();
      let generatedName = "AI Generated API";
      let generatedSlug = "ai-mock";
      let generatedFields: FieldDefinition[] = [
        { name: "id", type: "uuid" },
        { name: "name", type: "fullName" },
        { name: "email", type: "email" },
        { name: "status", type: "enum", options: ["active", "pending", "disabled"] },
        { name: "created_at", type: "date" },
      ];

      if (q.includes("invoice") || q.includes("billing") || q.includes("payment")) {
        generatedName = "Invoices API";
        generatedSlug = "invoices";
        generatedFields = [
          { name: "id", type: "uuid" },
          { name: "customer_name", type: "fullName" },
          { name: "customer_email", type: "email" },
          { name: "amount_due", type: "currency" },
          { name: "status", type: "enum", options: ["paid", "unpaid", "draft"] },
          { name: "due_date", type: "futureDate" },
          { name: "created_at", type: "date" },
        ];
      } else if (q.includes("subscription") || q.includes("saas")) {
        generatedName = "Subscriptions API";
        generatedSlug = "subscriptions";
        generatedFields = [
          { name: "id", type: "uuid" },
          { name: "user_email", type: "email" },
          { name: "plan_name", type: "enum", options: ["starter", "pro", "enterprise"] },
          { name: "monthly_price", type: "currency" },
          { name: "is_active", type: "boolean" },
          { name: "renewal_date", type: "futureDate" },
        ];
      } else if (q.includes("review") || q.includes("github") || q.includes("pr")) {
        generatedName = "Pull Request Reviews";
        generatedSlug = "pr-reviews";
        generatedFields = [
          { name: "id", type: "uuid" },
          { name: "author", type: "fullName" },
          { name: "author_avatar", type: "avatar" },
          { name: "state", type: "enum", options: ["approved", "changes_requested", "commented"] },
          { name: "comments_count", type: "number" },
          { name: "submitted_at", type: "date" },
        ];
      }

      setName(generatedName);
      setSlug(generatedSlug);
      setFields(generatedFields);
      setMode("manual");
      setAiGenerating(false);
      setAiPrompt("");
    }, 350);
  };

  const handleRunSimulation = () => {
    let reqBodyObj: any = undefined;
    if (["POST", "PUT", "PATCH"].includes(simMethod) && simBody) {
      try {
        reqBodyObj = JSON.parse(simBody);
      } catch {
        reqBodyObj = simBody;
      }
    }

    const reqContext = {
      headers: simHeaderKey ? { [simHeaderKey.toLowerCase()]: simHeaderVal } : {},
      query: simQueryKey ? { [simQueryKey]: simQueryVal } : {},
      body: reqBodyObj,
    };

    let matchedRuleIndex = -1;
    let matchedRule: ConditionalRule | undefined = undefined;
    let matchedResult: RuleEvaluationResult | undefined = undefined;

    for (let i = 0; i < rules.length; i++) {
      const res = evaluateConditionalRuleDetailed(rules[i], reqContext);
      if (res.matched) {
        matchedRuleIndex = i;
        matchedRule = rules[i];
        matchedResult = res;
        break;
      }
    }

    let schemaObj: any = { fields };
    if (mode === "json") {
      try {
        schemaObj = JSON.parse(rawJsonSample);
      } catch { }
    } else if (mode === "openapi") {
      try {
        schemaObj = { fields: parseOpenApiToFields(rawOpenApi) };
      } catch { }
    }

    if (matchedRule) {
      let parsedBody: any;
      try {
        parsedBody = JSON.parse(matchedRule.responseBody);
      } catch {
        parsedBody = { message: matchedRule.responseBody };
      }

      setSimDiagnosticResult({
        matched: true,
        ruleIndex: matchedRuleIndex + 1,
        matchedRule,
        reason: matchedResult?.reason || `Rule matched target ${matchedRule.target}`,
        statusCode: matchedRule.responseStatus,
        responseOutput: parsedBody,
      });
    } else {
      const mockOutput = generateMockResponse(
        schemaObj,
        responseType,
        arrayLength,
        undefined,
        seed === "" ? undefined : Number(seed)
      );

      setSimDiagnosticResult({
        matched: false,
        reason: "No rules matched request context. Returning default mock schema response.",
        statusCode,
        responseOutput: mockOutput,
      });
    }
  };

  const handleInferFromJson = () => {
    try {
      const parsed = JSON.parse(rawJsonSample);
      const sampleItem = Array.isArray(parsed) ? parsed[0] : parsed;
      if (sampleItem && typeof sampleItem === "object") {
        const newFields: FieldDefinition[] = Object.keys(sampleItem).map((key) => ({
          name: key,
          type: inferFieldType(key, sampleItem[key]),
        }));
        setFields(newFields);
        setMode("manual");
      }
    } catch {
      alert("Invalid JSON format in paste area.");
    }
  };

  const handleImportOpenApi = () => {
    try {
      const parsedFields = parseOpenApiToFields(rawOpenApi);
      if (parsedFields.length > 0) {
        setFields(parsedFields);
        setMode("manual");
      }
    } catch (err: any) {
      alert(`OpenAPI Parse Error: ${err.message}`);
    }
  };

  const addField = () => {
    setFields([...fields, { name: `field_${fields.length + 1}`, type: "fullName" }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const [showDiffModal, setShowDiffModal] = useState(false);

  const moveFieldUp = (index: number) => {
    if (index === 0) return;
    const next = [...fields];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setFields(next);
  };

  const moveFieldDown = (index: number) => {
    if (index === fields.length - 1) return;
    const next = [...fields];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setFields(next);
  };

  const updateField = (index: number, updated: Partial<FieldDefinition>) => {
    const next = [...fields];
    next[index] = { ...next[index], ...updated };
    setFields(next);
  };

  const addRule = () => {
    const newRule: ConditionalRule = {
      id: `rule_${Date.now()}`,
      target: "header",
      key: "authorization",
      operator: "missing",
      value: "",
      responseStatus: 401,
      responseBody: JSON.stringify({ error: "Unauthorized access token missing" }, null, 2),
    };
    setRules([...rules, newRule]);
  };

  const deleteRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const moveRuleUp = (index: number) => {
    if (index <= 0) return;
    setRules((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const moveRuleDown = (index: number) => {
    if (index >= rules.length - 1) return;
    setRules((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const updateRule = (index: number, updated: Partial<ConditionalRule>) => {
    const next = [...rules];
    next[index] = { ...next[index], ...updated };
    setRules(next);
  };

  const addRelation = () => {
    const newRel: EntityRelation = {
      id: `rel_${Date.now()}`,
      targetEndpoint: "users",
      foreignKey: "user_id",
      targetKey: "id",
      type: "belongsTo",
      onDelete: "cascade",
    };
    setRelations([...relations, newRel]);
  };

  const removeRelation = (index: number) => {
    setRelations(relations.filter((_, i) => i !== index));
  };

  const updateRelation = (index: number, updated: Partial<EntityRelation>) => {
    const next = [...relations];
    next[index] = { ...next[index], ...updated };
    setRelations(next);
  };

  const handleExportCsvFile = () => {
    if (!previewOutput) return;
    const records = Array.isArray(previewOutput) ? previewOutput : [previewOutput];
    const csvContent = exportToCSV(records);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "mock_data"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSqlFile = () => {
    if (!previewOutput) return;
    const records = Array.isArray(previewOutput) ? previewOutput : [previewOutput];
    const sqlContent = exportToSQL(slug || "mock_table", records);
    const blob = new Blob([sqlContent], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "mock_data"}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportXmlFile = () => {
    if (!previewOutput) return;
    const records = Array.isArray(previewOutput) ? previewOutput : [previewOutput];
    const xmlContent = exportToXML(slug || "records", records);
    const blob = new Blob([xmlContent], { type: "application/xml;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "mock_data"}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportOpenApiFile = () => {
    const spec: MockEndpointSpec = {
      name,
      slug,
      response_type: responseType,
      array_length: arrayLength,
      status_code: statusCode,
      latency_ms: latencyMs,
      schema_json: { fields },
    };
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://mockbit.io";
    const openApiContent = exportToOpenAPI(spec, baseUrl);
    const blob = new Blob([openApiContent], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "openapi_spec"}.openapi.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPostmanFile = () => {
    const spec: MockEndpointSpec = {
      name,
      slug,
      response_type: responseType,
      array_length: arrayLength,
      status_code: statusCode,
      latency_ms: latencyMs,
      schema_json: { fields },
    };
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://mockbit.io";
    const postmanContent = exportToPostman(spec, baseUrl);
    const blob = new Blob([postmanContent], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "postman_collection"}.postman_collection.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSqlDdlFile = () => {
    const ddlContent = exportToSqlTableDDL(slug || "records", fields, "postgres");
    const blob = new Blob([ddlContent], { type: "application/sql;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "schema"}_create_table.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdownDocsFile = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://mockbit.io";
    const docsContent = exportToMarkdownDoc(name, slug, fields, previewOutput, baseUrl);
    const blob = new Blob([docsContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "endpoint"}_api_docs.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHtmlTestBenchFile = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://mockbit.io";
    const htmlContent = exportToHtmlTestBench(name, slug, fields, previewOutput, baseUrl);
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "endpoint"}_test_bench.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveEndpoint = async () => {
    if (!name || !slug) {
      alert("Please specify an Endpoint Name and URL Slug.");
      return;
    }

    setSaving(true);

    let finalSchema: any = { fields };
    if (mode === "json") {
      try {
        finalSchema = JSON.parse(rawJsonSample);
      } catch {
        finalSchema = { fields };
      }
    } else if (mode === "openapi") {
      try {
        finalSchema = { fields: parseOpenApiToFields(rawOpenApi) };
      } catch {
        finalSchema = { fields };
      }
    }

    finalSchema = {
      ...finalSchema,
      relations,
      scenarios,
      latency_jitter_min: latencyJitterMin,
      latency_jitter_max: latencyJitterMax,
      flaky_error_rate: errorRate,
      flaky_error_statuses: flakyErrorStatuses,
      simulate_timeout: simulateTimeout,
    };

    const payload = {
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9-_]/g, "-"),
      response_type: responseType,
      array_length: arrayLength,
      status_code: statusCode,
      latency_ms: latencyMs,
      seed: seed === "" ? null : Number(seed),
      error_rate: errorRate,
      error_status: errorStatus,
      rules: rules.length > 0 ? rules : null,
      relations: relations.length > 0 ? relations : null,
      scenarios: scenarios.length > 0 ? scenarios : null,
      schema_json: finalSchema,
    };

    try {
      const { data, error } = await supabase
        .from("endpoints")
        .upsert(payload, { onConflict: "slug" })
        .select()
        .single();

      if (error) {
        saveToDemoStorage({ ...payload, id: `demo_${Date.now()}`, created_at: new Date().toISOString() });
      } else if (data) {
        saveToDemoStorage(data);
      }
    } catch {
      saveToDemoStorage({ ...payload, id: `demo_${Date.now()}`, created_at: new Date().toISOString() });
    } finally {
      setSaving(false);
      router.push("/dashboard");
    }
  };

  const saveToDemoStorage = (newEp: any) => {
    try {
      const existing = JSON.parse(localStorage.getItem("mockbit_demo_endpoints") || "[]");
      const filtered = existing.filter((e: any) => e.slug !== newEp.slug);
      filtered.unshift(newEp);
      localStorage.setItem("mockbit_demo_endpoints", JSON.stringify(filtered));
    } catch (err) {
      console.error("Failed to save demo endpoint:", err);
    }
  };

  return (
    <div className="min-h-screen bg-mb-bg text-mb-text flex flex-col font-sans">
      {/* Studio Header */}
      <header className="border-b border-mb-border bg-mb-bg/90 backdrop-saturate-150 px-6 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-md bg-mb-surface hover:bg-mb-surface-hover text-mb-text-tertiary hover:text-mb-text transition-colors border border-mb-border"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm text-mb-text flex items-center gap-2">
                Endpoint Studio
              </h1>
              {user ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-2xs font-mono font-medium" title="Endpoints created will be isolated to your account">
                  <Lock className="w-3 h-3" />
                  Private Workspace
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-2xs font-mono font-medium" title="Public demo mode — anyone with the URL can test. Sign in to lock.">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Public Demo Mode
                </span>
              )}
            </div>
            <p className="text-2xs text-mb-text-tertiary">Design mock API schema & preview live response output</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCommandPalette(true)}
            className="mb-btn-secondary inline-flex h-8 items-center px-2.5 text-xs text-mb-text-tertiary hover:text-mb-text"
            title="Search all commands (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5 mr-1" />
            <kbd className="text-3xs font-mono bg-mb-surface border border-mb-border px-1 rounded">⌘K</kbd>
          </button>

          <button
            onClick={() => setShowUnifiedImportModal(true)}
            className="mb-btn-secondary inline-flex h-8 items-center px-3 text-xs font-medium"
            title="Universal Import Hub (12 Formats)"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5 text-mb-text-tertiary" />
            <span>Import...</span>
          </button>

          <button
            onClick={() => setShowUnifiedExportModal(true)}
            className="mb-btn-secondary inline-flex h-8 items-center px-3 text-xs font-medium"
            title="Universal Export Hub (7 Targets)"
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5 text-mb-text-tertiary" />
            <span>Export...</span>
          </button>

          <button
            onClick={handleShareSchemaLink}
            className="mb-btn-secondary inline-flex h-8 items-center px-3 text-xs font-medium"
            title="Copy shareable Studio URL link"
          >
            <LinkIcon className="w-3.5 h-3.5 mr-1.5 text-mb-text-tertiary" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {!user && (
            <Link
              href="/login?redirect=/dashboard/endpoints/new"
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
              title="Sign in to lock endpoints to your account"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Sign In to Lock</span>
            </Link>
          )}

          <button
            onClick={() => setShowPreviewPanel(!showPreviewPanel)}
            className="mb-btn-secondary inline-flex h-8 items-center px-3 text-xs font-medium"
            title={showPreviewPanel ? "Hide Preview Panel" : "Show Preview Panel"}
          >
            {showPreviewPanel ? (
              <>
                <EyeOff className="w-3.5 h-3.5 mr-1.5 text-mb-text-tertiary" />
                <span className="hidden sm:inline">Hide Preview</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 mr-1.5 text-mb-text-tertiary" />
                <span className="hidden sm:inline">Show Preview</span>
              </>
            )}
          </button>

          <button
            onClick={handleSaveEndpoint}
            disabled={saving}
            className="mb-btn-primary inline-flex h-8 items-center px-3 text-xs"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
            <span>Save Endpoint</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Column: Form & Mode Editors */}
        <div
          className={`${showPreviewPanel
              ? "lg:col-span-7 border-r border-mb-border p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-56px)]"
              : "lg:col-span-12 p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-56px)]"
            }`}
        >
          {/* ========================================================================= */}
          {/* ZONE A: COMPACT FIXED HEADER STRIP (INLINE IDENTITY + SETTINGS + TABS)     */}
          {/* ========================================================================= */}
          <div className="p-3.5 rounded-lg mb-panel bg-mb-surface border border-mb-border space-y-3">
            {/* Line 1: Click-to-Edit Title, Slug & Settings Popover */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Orders API"
                  className="font-bold text-sm text-mb-text bg-transparent border border-transparent hover:border-mb-border focus:border-mb-border-focus rounded px-2 py-0.5 focus:outline-none truncate"
                />
                <span className="text-mb-text-disabled text-xs font-mono">/</span>
                <div className="flex items-center bg-mb-bg-raised border border-mb-border rounded px-2 py-0.5 text-xs text-mb-text-tertiary">
                  <span className="text-mb-text-disabled text-3xs mr-0.5">/api/v1/demo/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="orders"
                    className="bg-transparent text-mb-text focus:outline-none text-xs font-mono w-28"
                  />
                </div>
              </div>

              {/* Settings Popover Toggle */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowSettingsPopover(!showSettingsPopover)}
                  className="mb-btn-secondary h-7 px-2.5 text-xs inline-flex items-center gap-1.5"
                  title="Response Format & Array Count Settings"
                >
                  <Settings className="w-3.5 h-3.5 text-mb-text-tertiary" />
                  <span className="hidden sm:inline text-3xs font-mono uppercase">{responseType} ({arrayLength})</span>
                </button>

                {showSettingsPopover && (
                  <div className="absolute right-0 top-8 z-30 bg-mb-surface border border-mb-border rounded-lg p-3 shadow-xl w-60 space-y-3">
                    <div>
                      <label className="block text-3xs font-mono text-mb-text-tertiary uppercase mb-1">Response Format</label>
                      <select
                        value={responseType}
                        onChange={(e) => setResponseType(e.target.value as any)}
                        className="w-full bg-mb-bg-raised border border-mb-border rounded px-2 py-1 text-xs text-mb-text focus:outline-none"
                      >
                        <option value="array">JSON Array</option>
                        <option value="object">Single Object</option>
                      </select>
                    </div>

                    {responseType === "array" && (
                      <div>
                        <label className="block text-3xs font-mono text-mb-text-tertiary uppercase mb-1">Array Item Count (1-100)</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={arrayLength}
                          onChange={(e) => setArrayLength(Number(e.target.value))}
                          className="w-full bg-mb-bg-raised border border-mb-border rounded px-2 py-1 text-xs text-mb-text font-mono focus:outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-3xs font-mono text-mb-text-tertiary uppercase mb-1">Test Data Region / Locale</label>
                      <select
                        value={locale}
                        onChange={(e) => setLocale(e.target.value)}
                        className="w-full bg-mb-bg-raised border border-mb-border rounded px-2 py-1 text-xs text-mb-text focus:outline-none"
                      >
                        <option value="en">English (Default)</option>
                        <option value="zh_CN">Chinese (China) 🇨🇳</option>
                        <option value="ja">Japanese 🇯🇵</option>
                        <option value="fr">French 🇫🇷</option>
                        <option value="es">Spanish 🇪🇸</option>
                        <option value="es_MX">Spanish (Mexico) 🇲🇽</option>
                        <option value="pt_BR">Portuguese (Brazil) 🇧🇷</option>
                        <option value="id_ID">Indonesian 🇮🇩</option>
                        <option value="en_GB">English (Great Britain) 🇬🇧</option>
                        <option value="en_IN">English (India) 🇮🇳</option>
                        <option value="en_US">English (United States) 🇺🇸</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Line 2: Studio Sub-Navigation Tabs */}
            <div className="flex items-center p-0.5 rounded bg-mb-bg-raised border border-mb-border gap-1">
              <button
                onClick={() => setStudioTab("schema")}
                className={`flex-1 py-1 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${studioTab === "schema"
                    ? "bg-mb-surface-active text-mb-text shadow-sm"
                    : "text-mb-text-tertiary hover:text-mb-text"
                  }`}
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>1. Schema & Fields</span>
              </button>

              <button
                onClick={() => setStudioTab("behavior")}
                className={`flex-1 py-1 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${studioTab === "behavior"
                    ? "bg-mb-surface-active text-mb-text shadow-sm"
                    : "text-mb-text-tertiary hover:text-mb-text"
                  }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>2. Behavior & Rules ({rules.length})</span>
              </button>

              <button
                onClick={() => setStudioTab("relations")}
                className={`flex-1 py-1 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${studioTab === "relations"
                    ? "bg-mb-surface-active text-mb-text shadow-sm"
                    : "text-mb-text-tertiary hover:text-mb-text"
                  }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>3. Relations ({relations.length})</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ZONE B: FOCUSED PRIMARY EDITING SURFACE                                    */}
          {/* ========================================================================= */}
          {studioTab === "schema" && (
            <div className="space-y-4">
              {/* Mode Switcher & On-Demand AI Drawer Toggle */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center p-0.5 rounded bg-mb-bg-raised border border-mb-border gap-1">
                  <button
                    onClick={() => setMode("manual")}
                    className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${mode === "manual" ? "bg-mb-surface-active text-mb-text" : "text-mb-text-tertiary hover:text-mb-text"
                      }`}
                  >
                    <ListPlus className="w-3 h-3" />
                    <span>Manual Fields</span>
                  </button>

                  <button
                    onClick={() => setMode("json")}
                    className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${mode === "json" ? "bg-mb-surface-active text-mb-text" : "text-mb-text-tertiary hover:text-mb-text"
                      }`}
                  >
                    <Code2 className="w-3 h-3" />
                    <span>Paste JSON</span>
                  </button>

                  <button
                    onClick={() => setMode("openapi")}
                    className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${mode === "openapi" ? "bg-mb-surface-active text-mb-text" : "text-mb-text-tertiary hover:text-mb-text"
                      }`}
                  >
                    <FileJson className="w-3 h-3" />
                    <span>OpenAPI Spec</span>
                  </button>
                </div>

                {/* On-Demand AI Generator Button */}
                <button
                  onClick={() => setShowAiDrawer(!showAiDrawer)}
                  className={`mb-btn-secondary h-7 px-2.5 text-xs inline-flex items-center gap-1.5 transition-colors ${showAiDrawer ? "bg-mb-surface-active border-mb-text-tertiary" : ""
                    }`}
                >
                  <Wand2 className="w-3.5 h-3.5 text-mb-text" />
                  <span>Generate with AI</span>
                </button>
              </div>

              {/* On-Demand Expandable AI Prompt Box */}
              {showAiDrawer && (
                <div className="p-3 rounded-lg bg-mb-surface border border-mb-border space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-mono uppercase text-mb-text-tertiary font-semibold flex items-center gap-1">
                      <Wand2 className="w-3 h-3 text-mb-text" /> AI Schema Assistant
                    </span>
                    <button onClick={() => setShowAiDrawer(false)} className="text-mb-text-tertiary hover:text-mb-text">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGenerateFromAiPrompt()}
                      placeholder="e.g. Stripe Invoice with customer email, amount due, and line items..."
                      className="flex-1 bg-mb-bg-raised border border-mb-border rounded px-3 py-1.5 text-xs text-mb-text focus:outline-none"
                    />
                    <button
                      onClick={handleGenerateFromAiPrompt}
                      disabled={aiGenerating || !aiPrompt.trim()}
                      className="mb-btn-primary inline-flex h-8 items-center px-3 text-xs shrink-0 disabled:opacity-50"
                    >
                      {aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Wand2 className="w-3.5 h-3.5 mr-1.5" />}
                      <span>Generate</span>
                    </button>
                  </div>
                </div>
              )}

              {/* MODE A: MANUAL FIELD BUILDER */}
              {mode === "manual" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-3xs font-mono uppercase font-semibold text-mb-text-tertiary tracking-wider">
                      Schema Fields ({fields.length})
                    </h3>

                    <div className="flex items-center gap-2">
                      {/* Quickstart Templates Popover */}
                      <div className="relative">
                        <button
                          onClick={() => setShowTemplatePopover(!showTemplatePopover)}
                          className="text-xs text-mb-text-tertiary hover:text-mb-text underline underline-offset-2 transition-colors"
                        >
                          Start from a template
                        </button>

                        {showTemplatePopover && (
                          <div className="absolute right-0 top-6 z-30 bg-mb-surface border border-mb-border rounded-lg p-2 shadow-xl w-56 space-y-1">
                            <span className="block px-2 py-1 text-3xs font-mono text-mb-text-tertiary uppercase">Quickstart Presets</span>
                            {QUICKSTART_TEMPLATES.map((tmpl) => (
                              <button
                                key={tmpl.id}
                                onClick={() => {
                                  handleApplyTemplate(tmpl);
                                  setShowTemplatePopover(false);
                                }}
                                className="w-full text-left px-2 py-1.5 rounded hover:bg-mb-surface-hover text-xs text-mb-text flex items-center justify-between group"
                              >
                                <span className="font-medium">{tmpl.name}</span>
                                <span className="text-3xs font-mono text-mb-text-tertiary group-hover:text-mb-text">/{tmpl.slug}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={addField}
                        className="mb-btn-secondary inline-flex h-7 items-center px-2.5 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        <span>Add Field</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {fields.map((field, idx) => (
                      <div
                        key={idx}
                        className="flex flex-wrap md:flex-nowrap items-center gap-2 p-2.5 rounded-md mb-panel"
                      >
                        <div className="flex items-center gap-0.5 text-mb-text-disabled">
                          <button
                            onClick={() => moveFieldUp(idx)}
                            disabled={idx === 0}
                            className="p-0.5 rounded hover:text-mb-text disabled:opacity-30 transition-colors"
                            title="Move Field Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveFieldDown(idx)}
                            disabled={idx === fields.length - 1}
                            className="p-0.5 rounded hover:text-mb-text disabled:opacity-30 transition-colors"
                            title="Move Field Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(idx, { name: e.target.value })}
                          placeholder="field_name"
                          className="bg-mb-bg-raised border border-mb-border rounded px-2.5 py-1 text-xs text-mb-text focus:outline-none w-36 font-mono"
                        />

                        <select
                          value={field.type}
                          onChange={(e) => updateField(idx, { type: e.target.value as any })}
                          className="bg-mb-bg-raised border border-mb-border rounded px-2.5 py-1 text-xs text-mb-text focus:outline-none flex-1"
                        >
                          {FAKER_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        {field.type === "enum" && (
                          <input
                            type="text"
                            value={field.options?.join(", ") || ""}
                            onChange={(e) =>
                              updateField(idx, {
                                options: e.target.value.split(",").map((s) => s.trim()),
                              })
                            }
                            placeholder="opt1, opt2, opt3"
                            className="bg-mb-bg-raised border border-mb-border rounded px-2.5 py-1 text-xs text-mb-text-secondary focus:outline-none w-40 font-mono"
                          />
                        )}

                        {field.type === "template" && (
                          <div className="space-y-1">
                            <ContextualEchoToolbar
                              onInsertTag={(tag) =>
                                updateField(idx, { template: (field.template || "") + tag })
                              }
                            />
                            <input
                              type="text"
                              value={field.template || ""}
                              onChange={(e) => updateField(idx, { template: e.target.value })}
                              placeholder="{{pathParam 'company_id'}} or {{params.id}}"
                              className="bg-mb-bg-raised border border-mb-border rounded px-2.5 py-1 text-xs text-mb-text-secondary focus:outline-none w-56 font-mono"
                            />
                          </div>
                        )}

                        <button
                          onClick={() => removeField(idx)}
                          className="p-1 rounded text-mb-text-disabled hover:text-mb-error transition-colors ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MODE B: PASTE JSON */}
              {mode === "json" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-mb-text-tertiary">Paste sample JSON payload below:</span>
                    <button
                      onClick={handleInferFromJson}
                      className="mb-btn-secondary inline-flex h-7 items-center px-2.5 text-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      <span>Infer Schema Fields</span>
                    </button>
                  </div>

                  <textarea
                    value={rawJsonSample}
                    onChange={(e) => setRawJsonSample(e.target.value)}
                    rows={12}
                    className="w-full bg-mb-bg-raised border border-mb-border rounded-md p-3 font-mono text-xs text-mb-text-secondary focus:outline-none"
                  />
                </div>
              )}

              {/* MODE C: OPENAPI SPEC IMPORTER */}
              {mode === "openapi" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-mb-text-tertiary">Paste OpenAPI 3.0 specification:</span>
                    <button
                      onClick={handleImportOpenApi}
                      className="mb-btn-secondary inline-flex h-7 items-center px-2.5 text-xs"
                    >
                      <FileJson className="w-3.5 h-3.5 mr-1" />
                      <span>Parse OpenAPI</span>
                    </button>
                  </div>

                  <textarea
                    value={rawOpenApi}
                    onChange={(e) => setRawOpenApi(e.target.value)}
                    rows={12}
                    className="w-full bg-mb-bg-raised border border-mb-border rounded-md p-3 font-mono text-xs text-mb-text-secondary focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: BEHAVIOR & RULES */}
          {/* ========================================================================= */}
          {studioTab === "behavior" && (
            <div className="space-y-6">
              {/* Response Config Bar */}
              <div className="p-4 rounded-md mb-panel space-y-4">
                <h3 className="text-2xs font-semibold text-mb-text-tertiary uppercase tracking-wider">
                  HTTP Response Controls
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-2xs font-medium text-mb-text-tertiary mb-1">HTTP Status</label>
                    <input
                      type="number"
                      value={statusCode}
                      onChange={(e) => setStatusCode(Number(e.target.value))}
                      className="w-full bg-mb-bg-raised border border-mb-border rounded px-2.5 py-1 text-xs text-mb-text focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-medium text-mb-text-tertiary mb-1">Latency Delay</label>
                    <select
                      value={latencyMs}
                      onChange={(e) => setLatencyMs(Number(e.target.value))}
                      className="w-full bg-mb-bg-raised border border-mb-border rounded px-2.5 py-1 text-xs text-mb-text focus:outline-none"
                    >
                      <option value={0}>0ms (Instant)</option>
                      <option value={200}>200ms</option>
                      <option value={500}>500ms</option>
                      <option value={1000}>1000ms (1s)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-2xs font-medium text-mb-text-tertiary mb-1">Deterministic Seed</label>
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g. 12345"
                      className="w-full bg-mb-bg-raised border border-mb-border rounded px-2.5 py-1 text-xs text-mb-text focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-mb-border grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-medium text-mb-text-tertiary mb-1">Flaky Error Rate ({errorRate}%)</label>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={5}
                      value={errorRate}
                      onChange={(e) => setErrorRate(Number(e.target.value))}
                      className="w-full h-1.5 bg-mb-bg-raised rounded appearance-none cursor-pointer accent-mb-text my-2"
                    />
                  </div>

                  {errorRate > 0 && (
                    <div>
                      <label className="block text-2xs font-medium text-mb-text-tertiary mb-1">Injected Error Code</label>
                      <select
                        value={errorStatus}
                        onChange={(e) => setErrorStatus(Number(e.target.value))}
                        className="w-full bg-mb-bg-raised border border-mb-border rounded px-2.5 py-1 text-xs text-mb-text focus:outline-none"
                      >
                        <option value={500}>500 Internal Error</option>
                        <option value={503}>503 Service Unavailable</option>
                        <option value={429}>429 Rate Limit Exceeded</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-mb-border grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-medium text-mb-text-tertiary mb-1">
                      Latency Jitter Min / Max ({latencyJitterMin}ms - {latencyJitterMax}ms)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={latencyJitterMin}
                        onChange={(e) => setLatencyJitterMin(Number(e.target.value))}
                        placeholder="Min ms (100)"
                        className="w-1/2 bg-mb-bg-raised border border-mb-border rounded px-2.5 py-1 text-xs text-mb-text font-mono"
                      />
                      <span className="text-2xs text-mb-text-tertiary">to</span>
                      <input
                        type="number"
                        value={latencyJitterMax}
                        onChange={(e) => setLatencyJitterMax(Number(e.target.value))}
                        placeholder="Max ms (1500)"
                        className="w-1/2 bg-mb-bg-raised border border-mb-border rounded px-2.5 py-1 text-xs text-mb-text font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="simTimeout"
                      checked={simulateTimeout}
                      onChange={(e) => setSimulateTimeout(e.target.checked)}
                      className="rounded border-mb-border bg-mb-bg-raised text-mb-text"
                    />
                    <label htmlFor="simTimeout" className="text-2xs font-mono text-mb-text cursor-pointer">
                      Simulate Network Socket Hangup / Timeout
                    </label>
                  </div>

                  {/* Weighted Response Probability Split */}
                  <div className="pt-4 border-t border-mb-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xs font-semibold text-mb-text uppercase tracking-wider block">
                          Weighted Response Probability Split
                        </span>
                        <span className="text-3xs text-mb-text-tertiary">
                          Probabilistically select response variants (sum equals 100%)
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableWeighted}
                        onChange={(e) => setEnableWeighted(e.target.checked)}
                        className="rounded border-mb-border bg-mb-bg-raised text-mb-text"
                      />
                    </div>

                    {enableWeighted && (
                      <div className="space-y-2 p-3 bg-mb-bg border border-mb-border rounded-md">
                        {weightedResponses.map((v, i) => (
                          <div key={v.id} className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-3xs text-mb-text-tertiary w-16">Variant #{i + 1}</span>
                            <input
                              type="number"
                              value={v.weight}
                              onChange={(e) => {
                                const next = [...weightedResponses];
                                next[i].weight = Number(e.target.value);
                                setWeightedResponses(next);
                              }}
                              className="w-16 bg-mb-bg-raised border border-mb-border rounded px-2 py-0.5 text-xs text-mb-text"
                              placeholder="Weight %"
                            />
                            <span className="text-3xs text-mb-text-tertiary">%</span>

                            <select
                              value={v.status}
                              onChange={(e) => {
                                const next = [...weightedResponses];
                                next[i].status = Number(e.target.value);
                                setWeightedResponses(next);
                              }}
                              className="bg-mb-bg-raised border border-mb-border rounded px-2 py-0.5 text-xs text-mb-text"
                            >
                              <option value={200}>200 OK</option>
                              <option value={201}>201 Created</option>
                              <option value={400}>400 Bad Request</option>
                              <option value={401}>401 Unauthorized</option>
                              <option value={500}>500 Internal Error</option>
                              <option value={503}>503 Service Unavailable</option>
                            </select>

                            <span className="text-3xs text-mb-text-tertiary ml-auto">
                              X-Mockbit-Rule-Id: rule_{v.id}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Conditional Rules Section */}
              <div className="p-4 rounded-md mb-panel space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xs font-semibold text-mb-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-mb-text-tertiary" />
                      <span>Conditional Response Rules</span>
                    </h3>
                    <p className="text-2xs text-mb-text-tertiary mt-0.5">
                      Custom status & body when incoming headers/query params match
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingRule(undefined);
                        setShowCalloutRuleModal(true);
                      }}
                      className="mb-btn-primary inline-flex h-7 items-center px-2.5 text-xs gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Configure Callout / Advanced Rule</span>
                    </button>

                    <button
                      onClick={addRule}
                      className="mb-btn-secondary inline-flex h-7 items-center px-2.5 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      <span>Quick Rule</span>
                    </button>
                  </div>
                </div>

                {rules.length === 0 ? (
                  <div className="text-center py-4 text-2xs text-mb-text-disabled border border-dashed border-mb-border rounded">
                    No conditional rules added.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rules.map((rule, idx) => (
                      <div key={rule.id || idx} className="p-3 rounded bg-mb-bg-raised border border-mb-border space-y-3 relative group">
                        {/* Rule Priority Header */}
                        <div className="flex items-center justify-between border-b border-mb-border pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-3xs font-mono text-mb-text-tertiary bg-mb-surface px-1.5 py-0.5 rounded border border-mb-border">
                              Priority #{idx + 1}
                            </span>
                            {rule.calloutUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRule(rule);
                                  setShowCalloutRuleModal(true);
                                }}
                                className="px-2 py-0.5 text-3xs rounded bg-mb-accent/10 border border-mb-accent/30 text-mb-accent flex items-center gap-1 font-mono hover:bg-mb-accent/20 transition-colors"
                              >
                                <Send className="w-3 h-3" />
                                <span>{rule.calloutMode === "sync" ? "SYNC Proxy Callout" : "ASYNC Callout"}</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveRuleUp(idx)}
                              disabled={idx === 0}
                              className="px-1.5 py-0.5 text-3xs rounded bg-mb-surface border border-mb-border text-mb-text-secondary disabled:opacity-30 hover:text-mb-text transition-colors font-mono"
                              title="Move Rule Up (Higher Evaluation Priority)"
                            >
                              ▲ Up
                            </button>
                            <button
                              type="button"
                              onClick={() => moveRuleDown(idx)}
                              disabled={idx === rules.length - 1}
                              className="px-1.5 py-0.5 text-3xs rounded bg-mb-surface border border-mb-border text-mb-text-secondary disabled:opacity-30 hover:text-mb-text transition-colors font-mono"
                              title="Move Rule Down (Lower Evaluation Priority)"
                            >
                              ▼ Down
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRule(rule);
                                setShowCalloutRuleModal(true);
                              }}
                              className="px-2 py-0.5 text-3xs rounded bg-mb-surface border border-mb-border text-mb-text-secondary hover:text-mb-text transition-colors font-mono"
                            >
                              Edit Details
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                          <div>
                            <label className="block text-2xs text-mb-text-tertiary mb-0.5">IF Request Target</label>
                            <select
                              value={rule.target}
                              onChange={(e) => updateRule(idx, { target: e.target.value as any })}
                              className="w-full bg-mb-surface border border-mb-border rounded px-2 py-1 text-xs text-mb-text"
                            >
                              <option value="header">Header</option>
                              <option value="query">Query Parameter</option>
                              <option value="body">Body Property</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-2xs text-mb-text-tertiary mb-0.5">Key Name</label>
                            <input
                              type="text"
                              value={rule.key}
                              onChange={(e) => updateRule(idx, { key: e.target.value })}
                              placeholder="authorization"
                              className="w-full bg-mb-surface border border-mb-border rounded px-2 py-1 text-xs text-mb-text font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-2xs text-mb-text-tertiary mb-0.5">Condition</label>
                            <select
                              value={rule.operator}
                              onChange={(e) => updateRule(idx, { operator: e.target.value as any })}
                              className="w-full bg-mb-surface border border-mb-border rounded px-2 py-1 text-xs text-mb-text"
                            >
                              <option value="missing">Is Missing</option>
                              <option value="equals">Equals</option>
                              <option value="not_equals">Does Not Equal</option>
                              <option value="contains">Contains</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-2xs text-mb-text-tertiary mb-0.5">Value</label>
                            <input
                              type="text"
                              disabled={rule.operator === "missing"}
                              value={rule.value}
                              onChange={(e) => updateRule(idx, { value: e.target.value })}
                              placeholder="e.g. taken@test.com"
                              className="w-full bg-mb-surface border border-mb-border rounded px-2 py-1 text-xs text-mb-text font-mono disabled:opacity-40"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-start pt-1 border-t border-mb-border">
                          <div>
                            <label className="block text-2xs text-mb-text-tertiary mb-0.5">THEN Status</label>
                            <input
                              type="number"
                              value={rule.responseStatus}
                              onChange={(e) => updateRule(idx, { responseStatus: Number(e.target.value) })}
                              className="w-full bg-mb-surface border border-mb-border rounded px-2 py-1 text-xs text-mb-text font-mono"
                            />
                          </div>

                          <div className="sm:col-span-3 flex items-start gap-2">
                            <div className="flex-1">
                              <label className="block text-2xs text-mb-text-tertiary mb-0.5">THEN JSON Body</label>
                              <textarea
                                value={rule.responseBody}
                                onChange={(e) => updateRule(idx, { responseBody: e.target.value })}
                                rows={2}
                                className="w-full bg-mb-surface border border-mb-border rounded p-2 font-mono text-xs text-mb-text-secondary"
                              />
                            </div>

                            <button
                              onClick={() => deleteRule(idx)}
                              className="p-1.5 rounded text-mb-text-disabled hover:text-mb-error transition-colors mt-4"
                              title="Remove Rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: RELATIONS & PRESETS */}
          {/* ========================================================================= */}
          {studioTab === "relations" && (
            <div className="space-y-6">
              {/* Visual Entity Relation Graph */}
              <SchemaRelationGraph currentEndpointSlug={slug} relations={relations} />

              {/* Relational Foreign Key Configuration */}
              <div className="p-4 rounded-md mb-panel space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xs font-semibold text-mb-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-mb-text-tertiary" />
                      <span>Entity Relations & Foreign Keys</span>
                    </h3>
                    <p className="text-2xs text-mb-text-tertiary mt-0.5">
                      Declare relations to other endpoints (enables nested subpath routes and cascade deletes)
                    </p>
                  </div>

                  <button
                    onClick={addRelation}
                    className="mb-btn-secondary inline-flex h-7 items-center px-2.5 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Add Relation</span>
                  </button>
                </div>

                {relations.length === 0 ? (
                  <div className="text-center py-4 text-2xs text-mb-text-disabled border border-dashed border-mb-border rounded">
                    No foreign key relations declared.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {relations.map((rel, idx) => (
                      <div key={rel.id || idx} className="p-3 rounded bg-mb-bg-raised border border-mb-border space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                          <div>
                            <label className="block text-2xs text-mb-text-tertiary mb-0.5">Target Endpoint</label>
                            <input
                              type="text"
                              value={rel.targetEndpoint}
                              onChange={(e) => updateRelation(idx, { targetEndpoint: e.target.value })}
                              placeholder="users"
                              className="w-full bg-mb-surface border border-mb-border rounded px-2 py-1 text-xs text-mb-text font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-2xs text-mb-text-tertiary mb-0.5">Foreign Key Property</label>
                            <input
                              type="text"
                              value={rel.foreignKey}
                              onChange={(e) => updateRelation(idx, { foreignKey: e.target.value })}
                              placeholder="user_id"
                              className="w-full bg-mb-surface border border-mb-border rounded px-2 py-1 text-xs text-mb-text font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-2xs text-mb-text-tertiary mb-0.5">Relation Type</label>
                            <select
                              value={rel.type}
                              onChange={(e) => updateRelation(idx, { type: e.target.value as any })}
                              className="w-full bg-mb-surface border border-mb-border rounded px-2 py-1 text-xs text-mb-text"
                            >
                              <option value="belongsTo">Belongs To</option>
                              <option value="hasMany">Has Many</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="block text-2xs text-mb-text-tertiary mb-0.5">On Delete Action</label>
                              <select
                                value={rel.onDelete || "cascade"}
                                onChange={(e) => updateRelation(idx, { onDelete: e.target.value as any })}
                                className="w-full bg-mb-surface border border-mb-border rounded px-2 py-1 text-xs text-mb-text"
                              >
                                <option value="cascade">Cascade Delete</option>
                                <option value="setNull">Set Null</option>
                                <option value="restrict">Restrict</option>
                              </select>
                            </div>

                            <button
                              onClick={() => removeRelation(idx)}
                              className="p-1.5 rounded text-mb-text-disabled hover:text-mb-error transition-colors mt-3"
                              title="Remove Relation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Request Simulator & Live Preview */}
        <div
          className={`${showPreviewPanel
              ? "lg:col-span-5 bg-mb-bg p-6 flex flex-col border-t lg:border-t-0 border-mb-border space-y-4 overflow-y-auto max-h-[calc(100vh-56px)]"
              : "hidden"
            }`}
        >
          {/* Tab Controls */}
          <div className="flex items-center p-1 rounded-md bg-mb-bg-raised border border-mb-border gap-1">
            <button
              onClick={() => setRightColTab("simulator")}
              className={`flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${rightColTab === "simulator"
                  ? "bg-mb-surface-active text-mb-text"
                  : "text-mb-text-tertiary hover:text-mb-text"
                }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Simulator</span>
            </button>

            <button
              onClick={() => setRightColTab("preview")}
              className={`flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${rightColTab === "preview"
                  ? "bg-mb-surface-active text-mb-text"
                  : "text-mb-text-tertiary hover:text-mb-text"
                }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Live Schema Preview</span>
            </button>
          </div>

          {/* TAB 1: REQUEST SIMULATOR */}
          {rightColTab === "simulator" && (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="p-4 rounded-md mb-panel space-y-3">
                <h3 className="text-2xs font-semibold text-mb-text-tertiary uppercase tracking-wider flex items-center justify-between">
                  <span>Simulate Incoming Request</span>
                </h3>

                {/* Method & Trigger Button */}
                <div className="flex items-center gap-2">
                  <select
                    value={simMethod}
                    onChange={(e) => setSimMethod(e.target.value)}
                    className="bg-mb-bg-raised border border-mb-border rounded px-2.5 py-1 text-xs text-mb-text font-mono"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>

                  <button
                    onClick={handleRunSimulation}
                    className="mb-btn-primary flex-1 h-8 inline-flex items-center justify-center px-3 text-xs"
                  >
                    <Play className="w-3.5 h-3.5 mr-1" />
                    <span>Run Simulation</span>
                  </button>
                </div>

                {/* Simulator Inputs Grid */}
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="block text-2xs font-medium text-mb-text-tertiary mb-1">Header (Key / Value)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={simHeaderKey}
                        onChange={(e) => setSimHeaderKey(e.target.value)}
                        placeholder="authorization"
                        className="bg-mb-bg-raised border border-mb-border rounded px-2.5 py-1 text-xs text-mb-text font-mono"
                      />
                      <input
                        type="text"
                        value={simHeaderVal}
                        onChange={(e) => setSimHeaderVal(e.target.value)}
                        placeholder="Bearer token"
                        className="bg-mb-bg-raised border border-mb-border rounded px-2.5 py-1 text-xs text-mb-text font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-2xs font-medium text-mb-text-tertiary mb-1">Query Param (Key / Value)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={simQueryKey}
                        onChange={(e) => setSimQueryKey(e.target.value)}
                        placeholder="page"
                        className="bg-mb-bg-raised border border-mb-border rounded px-2.5 py-1 text-xs text-mb-text font-mono"
                      />
                      <input
                        type="text"
                        value={simQueryVal}
                        onChange={(e) => setSimQueryVal(e.target.value)}
                        placeholder="1"
                        className="bg-mb-bg-raised border border-mb-border rounded px-2.5 py-1 text-xs text-mb-text font-mono"
                      />
                    </div>
                  </div>

                  {["POST", "PUT", "PATCH"].includes(simMethod) && (
                    <div>
                      <label className="block text-2xs font-medium text-mb-text-tertiary mb-1">JSON Body Payload</label>
                      <textarea
                        value={simBody}
                        onChange={(e) => setSimBody(e.target.value)}
                        rows={3}
                        className="w-full bg-mb-bg-raised border border-mb-border rounded p-2 font-mono text-xs text-mb-text-secondary focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnostic Results Section */}
              <div className="flex-1 flex flex-col space-y-3">
                {simDiagnosticResult ? (
                  <>
                    <div className="p-3 rounded mb-panel text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-mb-text text-2xs flex items-center gap-1.5">
                          {simDiagnosticResult.matched ? (
                            <span>✓ Rule #{simDiagnosticResult.ruleIndex} Matched</span>
                          ) : (
                            <span>Default Fallback Executed</span>
                          )}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-mb-bg-raised border border-mb-border text-mb-text-secondary font-mono text-2xs">
                          HTTP {simDiagnosticResult.statusCode}
                        </span>
                      </div>

                      <p className="text-2xs text-mb-text-tertiary font-mono">
                        {simDiagnosticResult.reason}
                      </p>
                    </div>

                    <div className="flex-1 bg-mb-bg-raised border border-mb-border rounded-md p-3 font-mono text-xs text-mb-text-secondary overflow-y-auto max-h-[360px]">
                      <pre>{JSON.stringify(simDiagnosticResult.responseOutput, null, 2)}</pre>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center mb-panel text-mb-text-tertiary space-y-2">
                    <Terminal className="w-6 h-6 text-mb-text-disabled" />
                    <p className="text-2xs">Click <strong>"Run Simulation"</strong> to evaluate headers & rules.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE SCHEMA PREVIEW */}
          {rightColTab === "preview" && (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-mb-success" />
                  <h3 className="text-2xs font-semibold text-mb-text-tertiary uppercase tracking-wider">
                    Response Preview
                  </h3>
                </div>
                <button
                  onClick={generatePreview}
                  className="text-2xs text-mb-text-tertiary hover:text-mb-text flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>
              </div>

              <div className="flex-1 bg-mb-bg-raised border border-mb-border rounded-md p-3 font-mono text-xs text-mb-text-secondary overflow-y-auto max-h-[calc(100vh-140px)]">
                <pre>{JSON.stringify(previewOutput, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SdkGeneratorModal Component */}
      {showSdkModal && (
        <SdkGeneratorModal
          endpointName={name}
          slug={slug}
          fields={fields}
          responseType={responseType}
          onClose={() => setShowSdkModal(false)}
        />
      )}

      {/* Schema Draft JSON Inspector Modal */}
      {showDiffModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-mb-bg border border-mb-border rounded-lg max-w-2xl w-full p-6 space-y-4 shadow-mb-md">
            <div className="flex items-center justify-between border-b border-mb-border pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-mb-text" />
                <h3 className="text-sm font-semibold text-mb-text">Draft Endpoint Schema JSON</h3>
              </div>
              <button
                onClick={() => setShowDiffModal(false)}
                className="p-1 rounded text-mb-text-tertiary hover:text-mb-text transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-2xs text-mb-text-tertiary">
              Complete raw payload JSON object generated for endpoint <code className="font-mono text-mb-text">/api/v1/demo/{slug}</code>:
            </p>

            <pre className="p-4 rounded-md bg-mb-bg-raised border border-mb-border font-mono text-xs text-mb-text-secondary max-h-96 overflow-y-auto">
              {JSON.stringify(
                {
                  name,
                  slug,
                  response_type: responseType,
                  array_length: arrayLength,
                  status_code: statusCode,
                  latency_ms: latencyMs,
                  seed: seed === "" ? null : Number(seed),
                  error_rate: errorRate,
                  error_status: errorStatus,
                  rules,
                  relations,
                  scenarios,
                  fields,
                },
                null,
                2
              )}
            </pre>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify({ name, slug, response_type: responseType, array_length: arrayLength, fields, relations, rules }, null, 2)
                  );
                  alert("Copied draft schema to clipboard!");
                }}
                className="mb-btn-secondary inline-flex h-8 items-center px-3 text-xs"
              >
                Copy JSON
              </button>

              <button
                onClick={() => setShowDiffModal(false)}
                className="mb-btn-primary inline-flex h-8 items-center px-3 text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DB Schema Import Modal (Mockbit Twin Phase 0) */}
      {showDbImportModal && (
        <DbSchemaImportModal
          existingStudioSlug={slug}
          onImportSchemas={handleImportDbSchemas}
          onClose={() => setShowDbImportModal(false)}
        />
      )}

      {/* 1-Click MockAPI & JSON Importer Modal */}
      {showMockApiModal && (
        <MockApiImportModal
          onClose={() => setShowMockApiModal(false)}
          onImportSuccess={(data) => {
            setName(data.name);
            setSlug(data.slug);
            setFields(data.fields);
            setResponseType(data.responseType);
            setArrayLength(data.arrayLength);
            setRawJsonSample(JSON.stringify(data.sampleData, null, 2));
            setMode("json");
          }}
        />
      )}

      {/* CSV File Schema Importer Modal (Mockaroo Neutralizer Phase 2) */}
      {showCsvImportModal && (
        <CsvSchemaImportModal
          onClose={() => setShowCsvImportModal(false)}
          onImportSuccess={(data) => {
            setName(data.name);
            setSlug(data.slug);
            setFields(data.fields);
            setRawJsonSample(JSON.stringify(data.records, null, 2));
            setMode("json");
          }}
        />
      )}

      {/* Proxy & Live Traffic Recorder Modal (Mockoon Neutralizer Phase 1) */}
      {showProxyModal && (
        <ProxyRecorderModal
          onClose={() => setShowProxyModal(false)}
          onImportSuccess={(data) => {
            setName(data.name);
            setSlug(data.slug);
            setFields(data.fields);
            setResponseType(data.responseType);
            setArrayLength(data.arrayLength);
            setRawJsonSample(JSON.stringify(data.sampleData, null, 2));
            setMode("json");
          }}
        />
      )}
      {showInspectorModal && (
        <RequestInspectorModal
          onClose={() => setShowInspectorModal(false)}
          slugFilter={slug}
        />
      )}

      {/* Multi-Language Code Snippet Exporter Modal  */}
      {showCodeSnippetModal && (
        <CodeSnippetModal
          onClose={() => setShowCodeSnippetModal(false)}
          snippetParams={{
            url: typeof window !== "undefined" ? `${window.location.origin}/api/v1/public/${slug}` : `https://mockbit.io/api/v1/public/${slug}`,
            method: "GET",
          }}
        />
      )}
      {showPostmanImportModal && (
        <PostmanImportModal
          onClose={() => setShowPostmanImportModal(false)}
          onImportSuccess={(data) => {
            setName(data.name);
            setSlug(data.slug);
            setFields(data.fields);
            if (data.sampleData) {
              setRawJsonSample(JSON.stringify(data.sampleData, null, 2));
              setMode("json");
            }
          }}
        />
      )}

      {/* Paste cURL Command Importer Modal  */}
      {showCurlImportModal && (
        <CurlImportModal
          onClose={() => setShowCurlImportModal(false)}
          onImportSuccess={(data) => {
            setName(data.name);
            setSlug(data.slug);
            setFields(data.fields);
            if (data.sampleData) {
              setRawJsonSample(JSON.stringify(data.sampleData, null, 2));
              setMode("json");
            }
          }}
        />
      )}

      {/* Insomnia & Bruno Workspace Importer Modal */}
      {showInsomniaImportModal && (
        <InsomniaImportModal
          onClose={() => setShowInsomniaImportModal(false)}
          onImportSuccess={(data) => {
            setName(data.name);
            setSlug(data.slug);
            setFields(data.fields);
            if (data.sampleData) {
              setRawJsonSample(JSON.stringify(data.sampleData, null, 2));
              setMode("json");
            }
          }}
        />
      )}

      {/* HAR Web Traffic Drag & Drop Importer Modal */}
      {showHarImportModal && (
        <HarImportModal
          onClose={() => setShowHarImportModal(false)}
          onImportSuccess={(data) => {
            setName(data.name);
            setSlug(data.slug);
            setFields(data.fields);
            if (data.sampleData) {
              setRawJsonSample(JSON.stringify(data.sampleData, null, 2));
              setMode("json");
            }
          }}
        />
      )}

      {/* WireMock JSON Stub Mapping Importer Modal */}
      {showWireMockImportModal && (
        <WireMockImportModal
          onClose={() => setShowWireMockImportModal(false)}
          onImportSuccess={(data) => {
            setName(data.name);
            setSlug(data.slug);
            setFields(data.fields);
            if (data.sampleData) {
              setRawJsonSample(JSON.stringify(data.sampleData, null, 2));
              setMode("json");
            }
          }}
        />
      )}

      {/* GraphQL Schema SDL Importer Modal */}
      {showGraphQLSdlImportModal && (
        <GraphQLSdlImportModal
          onClose={() => setShowGraphQLSdlImportModal(false)}
          onImportSuccess={(data) => {
            setName(data.name);
            setSlug(data.slug);
            setFields(data.fields);
          }}
        />
      )}

      {/* TypeScript Interface Importer Modal */}
      {showTypeScriptImportModal && (
        <TypeScriptImportModal
          onClose={() => setShowTypeScriptImportModal(false)}
          onImportSuccess={(data) => {
            setName(data.name);
            setSlug(data.slug);
            setFields(data.fields);
          }}
        />
      )}

      {/* JSON Schema v4/v7 Importer Modal */}
      {showJsonSchemaImportModal && (
        <JsonSchemaImportModal
          onClose={() => setShowJsonSchemaImportModal(false)}
          onImportSuccess={(data) => {
            setName(data.name);
            setSlug(data.slug);
            setFields(data.fields);
          }}
        />
      )}

      {/* Unified Import Hub Modal */}
      {showUnifiedImportModal && (
        <UnifiedImportModal
          onClose={() => setShowUnifiedImportModal(false)}
          onSelectFormat={handleSelectImportFormat}
        />
      )}

      {/* Unified Export Hub Modal */}
      {showUnifiedExportModal && (
        <UnifiedExportModal
          onClose={() => setShowUnifiedExportModal(false)}
          onSelectExport={handleSelectExportFormat}
        />
      )}

      {/* Global Studio Command Palette (Cmd+K) */}
      <StudioCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectImportFormat={handleSelectImportFormat}
        onSelectExportFormat={handleSelectExportFormat}
        onTriggerTool={(toolId) => {
          if (toolId === "inspector") setShowInspectorModal(true);
          else if (toolId === "proxy") setShowProxyModal(true);
          else if (toolId === "sdk") setShowSdkModal(true);
          else if (toolId === "webhook") setShowWebhookModal(true);
          else if (toolId === "websocket") setShowWebSocketModal(true);
        }}
      />

      {/* Webhook Event Dispatcher Modal */}
      {showWebhookModal && (
        <WebhookTriggerModal onClose={() => setShowWebhookModal(false)} />
      )}

      {/* Mock WebSocket Socket Test Bench Modal */}
      {showWebSocketModal && (
        <WebSocketTestModal onClose={() => setShowWebSocketModal(false)} />
      )}

      {/* Google Protocol Buffers (.proto) Importer Modal */}
      {showProtobufImportModal && (
        <ProtobufImportModal
          onClose={() => setShowProtobufImportModal(false)}
          onImportSuccess={(data) => {
            setName(data.name);
            setSlug(data.slug);
            setFields(data.fields);
          }}
        />
      )}

      {/* Callout & Advanced Rule Builder Modal */}
      <CalloutRuleBuilderModal
        isOpen={showCalloutRuleModal}
        onClose={() => setShowCalloutRuleModal(false)}
        initialRule={editingRule}
        onSaveRule={(newRule) => {
          if (editingRule) {
            setRules((prev) => prev.map((r) => (r.id === editingRule.id ? newRule : r)));
          } else {
            setRules((prev) => [...prev, newRule]);
          }
        }}
      />
    </div>
  );
}

export default function NewEndpointPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-mb-bg text-mb-text p-8">Loading Studio...</div>}>
      <NewEndpointForm />
    </Suspense>
  );
}
