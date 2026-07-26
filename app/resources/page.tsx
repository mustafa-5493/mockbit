"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PUBLIC_DATASETS, PublicDataset } from "@/lib/datasets";
import { SCENARIO_PACKS, ScenarioPack, computeCumulativeDiff } from "@/lib/datasets/scenarios";
import { RESILIENCE_BUNDLES, ResilienceBundle, VectorItem } from "@/lib/datasets/resilience";
import { ARENA_WORLDS, ArenaWorld } from "@/lib/datasets/arena";
import {
  ENTERPRISE_BEHAVIORS,
  FAILURE_ATLAS,
  AGENT_BENCHMARKS,
  SEMANTIC_METADATA,
} from "@/lib/datasets/knowledge";
import { runEventCascade, CascadeExecutionResult, generateArenaRunArtifact } from "@/lib/event-engine";
import {
  Database,
  Copy,
  Check,
  Play,
  ArrowRight,
  Sparkles,
  Layers,
  Link as LinkIcon,
  Search,
  Code2,
  GitBranch,
  History,
  Clock,
  GitFork,
  ShieldAlert,
  Bot,
  Globe,
  Cpu,
  ShieldCheck,
  Zap,
} from "lucide-react";

function MarkIcon() {
  return (
    <svg className="w-5 h-5 text-mb-text shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 17l6-6-6-6M12 19h8" />
    </svg>
  );
}

export default function PublicDatasetsHubPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<"datasets" | "journeys" | "resilience" | "arena" | "knowledge">("datasets");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeDatasetSlug, setActiveDatasetSlug] = useState<string>("products");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Journeys State
  const [activeJourneyId, setActiveJourneyId] = useState<string>("cart-abandonment");
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"step" | "compare">("step");
  const [compareStepIndex, setCompareStepIndex] = useState<number>(0);

  // Resilience State
  const [activeResilienceId, setActiveResilienceId] = useState<string>("security");
  const [activeVectorId, setActiveVectorId] = useState<string>("sqli_1");

  // Mockbit Arena State
  const [activeArenaWorldId, setActiveArenaWorldId] = useState<string>("fintech-billing");
  const [cascadeResult, setCascadeResult] = useState<CascadeExecutionResult | null>(null);

  const categories = [
    "All",
    "E-Commerce",
    "Users & SaaS",
    "Fintech & Banking",
    "Healthcare & EHR",
    "Travel & Aviation",
    "Gaming & Esports",
    "AI & ML Agent Traces",
    "IoT & Telemetry",
  ];

  const filteredDatasets = PUBLIC_DATASETS.filter((ds) => {
    const matchesCat = selectedCategory === "All" || ds.category === selectedCategory;
    const matchesQuery =
      ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const activeDataset = PUBLIC_DATASETS.find((d) => d.slug === activeDatasetSlug) || PUBLIC_DATASETS[0];
  const activeJourney = SCENARIO_PACKS.find((j) => j.id === activeJourneyId) || SCENARIO_PACKS[0];
  const activeStep = activeJourney.steps[activeStepIndex] || activeJourney.steps[0];
  const compareStep = activeJourney.steps[compareStepIndex] || activeJourney.steps[0];

  const activeResilienceBundle = RESILIENCE_BUNDLES.find((b) => b.id === activeResilienceId) || RESILIENCE_BUNDLES[0];
  const activeVector = activeResilienceBundle.vectors.find((v) => v.id === activeVectorId) || activeResilienceBundle.vectors[0];

  const activeArenaWorld = ARENA_WORLDS.find((w) => w.id === activeArenaWorldId) || ARENA_WORLDS[0];

  const [dropChaosEvent, setDropChaosEvent] = useState<boolean>(false);

  const handleRunEventCascade = () => {
    let triggerEvent = "stripe.refund.created";
    let initialPayload: Record<string, any> = { amount: 49.0, customer_id: "cus_9901" };

    if (activeArenaWorld.id === "devops-incident") {
      triggerEvent = "github.pr.merged";
      initialPayload = { pr_id: 42, repo: "owner/api-service" };
    } else if (activeArenaWorld.id === "salesforce-lead2cash") {
      triggerEvent = "salesforce.opportunity.closed_won";
      initialPayload = { opportunity_id: "OPP_9901", account_id: "ACC_4012", arr: 120000.0 };
    } else if (activeArenaWorld.id === "aws-cloud") {
      triggerEvent = "aws.iam.policy_violation";
      initialPayload = { policy_id: "POL_9901", bucket_name: "prod-customer-data" };
    }

    const chaosPolicy = dropChaosEvent ? { drop_events: ["accounting.ledger.updated", "cpq.quote.approved"] } : undefined;

    const res = runEventCascade(
      triggerEvent,
      initialPayload,
      activeArenaWorld.event_rules || [],
      activeArenaWorld.invariants || [],
      activeArenaWorld.workflows || [],
      chaosPolicy,
      activeArenaWorld.id
    );
    setCascadeResult(res);
  };

  const handleDownloadArtifact = () => {
    if (!cascadeResult) return;
    const artifact = generateArenaRunArtifact(cascadeResult);
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arena-run-${cascadeResult.executionHash.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [origin, setOrigin] = useState<string>("https://mockbit.io");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const handleCopyCurl = (slug: string) => {
    const curl = `curl ${origin}/api/v1/public/${slug}`;
    navigator.clipboard.writeText(curl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 1800);
  };

  const handleCopyFullJourneyCurl = (endpointSlug: string, journeyId: string, version: number, branchId?: string) => {
    const scenarioKey = branchId ? `${journeyId}-v${version}-${branchId}` : `${journeyId}-v${version}`;
    const fullCurl = `curl -X GET "${origin}/api/v1/public/${endpointSlug}" \\\n  -H "X-Mockbit-Scenario: ${scenarioKey}"`;
    navigator.clipboard.writeText(fullCurl);
    setCopiedSlug(`full-curl-${version}`);
    setTimeout(() => setCopiedSlug(null), 1800);
  };

  const handleCopyResilienceCurl = (bundleId: string) => {
    const curl = `curl ${origin}/api/v1/public/resilience/${bundleId}`;
    navigator.clipboard.writeText(curl);
    setCopiedSlug(`resilience-${bundleId}`);
    setTimeout(() => setCopiedSlug(null), 1800);
  };

  const handleCopyArenaCurl = (worldId: string) => {
    const curl = `curl ${origin}/api/v1/public/arena/${worldId}`;
    navigator.clipboard.writeText(curl);
    setCopiedSlug(`arena-${worldId}`);
    setTimeout(() => setCopiedSlug(null), 1800);
  };

  const handleCloneToWorkspace = (ds: PublicDataset) => {
    const params = new URLSearchParams();
    params.set("simMethod", "GET");
    const payload = {
      name: ds.name,
      slug: ds.slug,
      response_type: "array",
      array_length: ds.records.length,
      records: ds.records,
    };
    const b64 = btoa(encodeURIComponent(JSON.stringify(payload)));
    router.push(`/dashboard/endpoints/new?schema=${b64}`);
  };

  const cumulativeDiffs = computeCumulativeDiff(compareStep.state, activeStep.state);

  return (
    <div className="min-h-screen bg-mb-bg text-mb-text flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="border-b border-mb-border bg-mb-bg/90 backdrop-saturate-150 px-6 h-14 flex items-center justify-between sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2 group">
          <MarkIcon />
          <span className="font-semibold text-sm tracking-tight text-mb-text">mockbit</span>
          <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-mb-bg-raised text-mb-text-tertiary border border-mb-border">
            Public APIs & Agent Substrate
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/docs" className="text-mb-text-tertiary hover:text-mb-text transition-colors text-xs font-medium mr-1">
            Docs & Template Engine
          </Link>
          <Link href="/dashboard" className="mb-btn-secondary inline-flex h-8 items-center px-3 text-xs">
            <span>Dashboard</span>
          </Link>

          <Link href="/dashboard/endpoints/new" className="mb-btn-primary inline-flex h-8 items-center px-3 text-xs">
            <span>Create Custom API</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Header Hero Section */}
        <div className="space-y-3 border-b border-mb-border pb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mb-surface border border-mb-border text-2xs text-mb-text-secondary font-mono">
            <Sparkles className="w-3 h-3 text-mb-text-tertiary" />
            <span>Datasets · Time-Travel Journeys · Security Harnesses · Mockbit Arena</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-mb-text">
            Public Mock APIs & AI Agent Execution Substrate
          </h1>

          <p className="text-sm text-mb-text-secondary max-w-2xl leading-relaxed">
            Access domain REST endpoints, scrub through scenario version steps, test input resilience, or run autonomous AI agents in Mockbit Arena — the world's safest synthetic internet for software agents.
          </p>

          {/* Section Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <button
              onClick={() => setActiveSection("datasets")}
              className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors border ${
                activeSection === "datasets"
                  ? "bg-mb-surface text-mb-text border-mb-border shadow-sm"
                  : "bg-mb-bg text-mb-text-tertiary border-transparent hover:text-mb-text"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>13+ Public Domain Datasets</span>
            </button>

            <button
              onClick={() => setActiveSection("journeys")}
              className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors border ${
                activeSection === "journeys"
                  ? "bg-mb-surface text-mb-text border-mb-border shadow-sm"
                  : "bg-mb-bg text-mb-text-tertiary border-transparent hover:text-mb-text"
              }`}
            >
              <History className="w-4 h-4 text-mb-text-tertiary" />
              <span>Interactive Time-Travel Journeys</span>
            </button>

            <button
              onClick={() => setActiveSection("resilience")}
              className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors border ${
                activeSection === "resilience"
                  ? "bg-mb-surface text-mb-text border-mb-border shadow-sm"
                  : "bg-mb-bg text-mb-text-tertiary border-transparent hover:text-mb-text"
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-mb-text-tertiary" />
              <span>QA & Resilience Harnesses</span>
            </button>

            <button
              onClick={() => setActiveSection("arena")}
              className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors border ${
                activeSection === "arena"
                  ? "bg-mb-surface text-mb-text border-mb-border shadow-sm"
                  : "bg-mb-bg text-mb-text-tertiary border-transparent hover:text-mb-text"
              }`}
            >
              <Bot className="w-4 h-4 text-mb-text-tertiary" />
              <span>Mockbit Arena (AI Agent Substrate)</span>
            </button>

            <button
              onClick={() => setActiveSection("knowledge")}
              className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors border ${
                activeSection === "knowledge"
                  ? "bg-mb-surface text-mb-text border-mb-border shadow-sm"
                  : "bg-mb-bg text-mb-text-tertiary border-transparent hover:text-mb-text"
              }`}
            >
              <Cpu className="w-4 h-4 text-mb-text-tertiary" />
              <span>Enterprise Knowledge Packs</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: PUBLIC DATASETS */}
        {activeSection === "datasets" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1 bg-mb-surface p-1 rounded-md border border-mb-border overflow-x-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-mb-surface-active text-mb-text shadow-sm"
                        : "text-mb-text-tertiary hover:text-mb-text"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-mb-text-tertiary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search datasets..."
                  className="w-full bg-mb-bg-raised border border-mb-border rounded-md px-3 py-1.5 pl-8 text-xs text-mb-text focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredDatasets.map((ds) => {
                  const isSelected = ds.slug === activeDatasetSlug;
                  return (
                    <div
                      key={ds.slug}
                      onClick={() => setActiveDatasetSlug(ds.slug)}
                      className={`mb-panel p-5 space-y-4 cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? "border-mb-text bg-mb-surface shadow-mb-md"
                          : "hover:border-mb-border-hover bg-mb-bg"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-mono px-2 py-0.5 rounded bg-mb-bg-raised text-mb-text-tertiary border border-mb-border">
                          {ds.category}
                        </span>
                        <span className="text-2xs font-mono text-mb-text-disabled">
                          {ds.records.length} items
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-mb-text flex items-center gap-1.5">
                          <span>{ds.name}</span>
                        </h3>
                        <p className="text-2xs text-mb-text-tertiary mt-1 line-clamp-2 leading-relaxed">
                          {ds.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-mb-border flex items-center justify-between text-2xs font-mono text-mb-text-tertiary">
                        <span>/api/v1/public/{ds.slug}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-mb-text-tertiary" />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="lg:col-span-5 mb-panel p-5 space-y-4 bg-mb-surface sticky top-20">
                <div className="flex items-center justify-between border-b border-mb-border pb-3">
                  <div>
                    <h3 className="text-xs font-semibold text-mb-text flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-mb-text" />
                      <span>{activeDataset.name}</span>
                    </h3>
                    <p className="text-2xs font-mono text-mb-text-tertiary">GET /api/v1/public/{activeDataset.slug}</p>
                  </div>

                  <button
                    onClick={() => handleCopyCurl(activeDataset.slug)}
                    className="mb-btn-secondary inline-flex h-7 items-center px-2.5 text-2xs"
                  >
                    {copiedSlug === activeDataset.slug ? (
                      <Check className="w-3 h-3 text-mb-success mr-1" />
                    ) : (
                      <Copy className="w-3 h-3 mr-1" />
                    )}
                    <span>{copiedSlug === activeDataset.slug ? "Copied" : "Copy cURL"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-2xs font-mono">
                  <div className="p-2 rounded bg-mb-bg-raised border border-mb-border">
                    <span className="text-mb-text-tertiary block">Stateful CRUD</span>
                    <span className="text-mb-text font-semibold">GET, POST, DELETE</span>
                  </div>
                  <div className="p-2 rounded bg-mb-bg-raised border border-mb-border">
                    <span className="text-mb-text-tertiary block">Relations</span>
                    <span className="text-mb-text font-semibold">
                      {activeDataset.relations && activeDataset.relations.length > 0 ? "Declared FK" : "Standalone"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-2xs font-mono text-mb-text-tertiary flex items-center justify-between">
                    <span>Sample Payload ({activeDataset.records.length} records)</span>
                    <span className="text-mb-success font-semibold">200 OK</span>
                  </span>

                  <pre className="p-3.5 bg-mb-bg-raised border border-mb-border rounded-md font-mono text-2xs text-mb-text-secondary max-h-72 overflow-y-auto leading-relaxed">
                    <code>{JSON.stringify(activeDataset.records, null, 2)}</code>
                  </pre>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleCloneToWorkspace(activeDataset)}
                    className="mb-btn-primary flex-1 inline-flex h-8 items-center justify-center px-3 text-xs"
                  >
                    <Code2 className="w-3.5 h-3.5 mr-1.5" />
                    <span>Clone to Endpoint Studio</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: INTERACTIVE TIME-TRAVEL JOURNEYS */}
        {activeSection === "journeys" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xs font-semibold text-mb-text uppercase tracking-wider">Select Journey Scenario</h3>
              {SCENARIO_PACKS.map((pack) => {
                const isSelected = pack.id === activeJourneyId;
                return (
                  <div
                    key={pack.id}
                    onClick={() => {
                      setActiveJourneyId(pack.id);
                      setActiveStepIndex(0);
                      setCompareStepIndex(0);
                    }}
                    className={`mb-panel p-5 space-y-3 cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "border-mb-text bg-mb-surface shadow-mb-md"
                        : "hover:border-mb-border-hover bg-mb-bg"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-mono px-2 py-0.5 rounded bg-mb-bg-raised text-mb-text-tertiary border border-mb-border">
                        {pack.category}
                      </span>
                      <span className="text-2xs font-mono text-mb-text-tertiary">
                        {pack.steps.length} versions
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-mb-text">{pack.name}</h4>
                    <p className="text-2xs text-mb-text-tertiary leading-relaxed">{pack.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-7 mb-panel p-6 space-y-6 bg-mb-surface sticky top-20">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mb-border pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-mb-text flex items-center gap-2">
                    <History className="w-4 h-4 text-mb-text" />
                    <span>{activeJourney.name}</span>
                  </h3>
                  <p className="text-2xs font-mono text-mb-text-tertiary mt-0.5">
                    Endpoint: /api/v1/public/{activeJourney.endpointSlug}
                  </p>
                </div>

                <button
                  onClick={() => handleCopyFullJourneyCurl(activeJourney.endpointSlug, activeJourney.id, activeStep.version, activeStep.branchId)}
                  className="mb-btn-secondary inline-flex h-8 items-center px-3 text-xs font-mono"
                >
                  {copiedSlug === `full-curl-${activeStep.version}` ? (
                    <Check className="w-3.5 h-3.5 text-mb-success mr-1.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  <span>{copiedSlug === `full-curl-${activeStep.version}` ? "Copied 1-Liner cURL" : "Copy cURL Command"}</span>
                </button>
              </div>

              <div className="flex items-center justify-between bg-mb-bg-raised p-1 rounded-md border border-mb-border">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMode("step")}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      viewMode === "step" ? "bg-mb-surface-active text-mb-text shadow-sm" : "text-mb-text-tertiary hover:text-mb-text"
                    }`}
                  >
                    Step-by-Step View
                  </button>
                  <button
                    onClick={() => setViewMode("compare")}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      viewMode === "compare" ? "bg-mb-surface-active text-mb-text shadow-sm" : "text-mb-text-tertiary hover:text-mb-text"
                    }`}
                  >
                    Compare Two Versions (Cumulative Diff)
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-2xs font-mono text-mb-text-tertiary flex items-center justify-between">
                  <span>{viewMode === "step" ? "Select Active Version Step:" : "Select Target Version (B):"}</span>
                  <span className="text-mb-text-disabled">Click any version to inspect</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {activeJourney.steps.map((step, idx) => {
                    const isActive = idx === activeStepIndex;
                    return (
                      <button
                        key={`${step.version}-${step.branchId || idx}`}
                        onClick={() => setActiveStepIndex(idx)}
                        className={`p-2.5 rounded border text-left transition-all ${
                          isActive
                            ? "bg-mb-surface-active border-mb-text text-mb-text shadow-sm"
                            : "bg-mb-bg-raised border-mb-border text-mb-text-tertiary hover:border-mb-border-hover hover:text-mb-text"
                        }`}
                      >
                        <span className="text-2xs font-mono font-semibold block flex items-center justify-between">
                          <span>v{step.version}</span>
                          {step.branchId && <span className="text-[9px] uppercase px-1 rounded bg-mb-surface font-mono">{step.branchId}</span>}
                        </span>
                        <span className="text-[10px] truncate block opacity-80 mt-1">{step.label.split(":")[1] || step.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {viewMode === "compare" && (
                <div className="p-3 rounded-md bg-mb-bg-raised border border-mb-border space-y-2">
                  <span className="text-2xs font-mono text-mb-text-tertiary block">Compare Against Initial Version (A):</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={compareStepIndex}
                      onChange={(e) => setCompareStepIndex(Number(e.target.value))}
                      className="bg-mb-surface border border-mb-border rounded px-2.5 py-1 text-xs text-mb-text font-mono"
                    >
                      {activeJourney.steps.map((step, idx) => (
                        <option key={idx} value={idx}>
                          {step.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-mb-text-tertiary">➔</span>
                    <span className="text-xs font-mono text-mb-text font-semibold">{activeStep.label}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3 p-4 rounded-md bg-mb-bg-raised border border-mb-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-mb-text flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-mb-text-tertiary" />
                    <span>{viewMode === "step" ? activeStep.label : `Cumulative Delta (${compareStep.label} ➔ ${activeStep.label})`}</span>
                  </span>
                  <span className="text-2xs font-mono px-2 py-0.5 rounded bg-mb-surface border border-mb-border text-mb-text-secondary">
                    {activeStep.action}
                  </span>
                </div>

                <div className="p-3 rounded bg-mb-surface border border-mb-border font-mono text-2xs space-y-1">
                  <span className="text-mb-text-tertiary block mb-1">
                    {viewMode === "step" ? "State Mutation Diffs:" : "Cumulative Differences:"}
                  </span>
                  {(viewMode === "step" ? activeStep.diff : cumulativeDiffs).map((d, i) => (
                    <div
                      key={i}
                      className={
                        d.startsWith("+")
                          ? "text-mb-success"
                          : d.startsWith("-")
                          ? "text-mb-text-disabled"
                          : "text-mb-text"
                      }
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-2xs font-mono text-mb-text-tertiary">
                  <span>State Store Ledger Snapshot ({activeStep.label})</span>
                  <span className="text-mb-success font-semibold">Live Store Active</span>
                </div>

                <pre className="p-4 bg-mb-bg-raised border border-mb-border rounded-md font-mono text-2xs text-mb-text-secondary max-h-64 overflow-y-auto leading-relaxed">
                  <code>{JSON.stringify(activeStep.state, null, 2)}</code>
                </pre>
              </div>

              <div className="p-3 rounded-md border border-mb-border bg-mb-bg-raised flex items-start gap-2 text-2xs text-mb-text-tertiary">
                <GitFork className="w-4 h-4 text-mb-text shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-mb-text block mb-0.5">Read-Only Pre-Baked Snapshot vs Live Writable Fork</span>
                  Scrubbing versions shows pre-baked scenario snapshots. To fork a live writable timeline from any version, pass header <code className="font-mono text-mb-text">X-Mockbit-Branch: my-custom-pr</code> in your API calls.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: QA & RESILIENCE HARNESSES */}
        {activeSection === "resilience" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xs font-semibold text-mb-text uppercase tracking-wider">Select Resilience Harness</h3>
              {RESILIENCE_BUNDLES.map((bundle) => {
                const isSelected = bundle.id === activeResilienceId;
                return (
                  <div
                    key={bundle.id}
                    onClick={() => {
                      setActiveResilienceId(bundle.id);
                      setActiveVectorId(bundle.vectors[0].id);
                    }}
                    className={`mb-panel p-5 space-y-3 cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "border-mb-text bg-mb-surface shadow-mb-md"
                        : "hover:border-mb-border-hover bg-mb-bg"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-mono px-2 py-0.5 rounded bg-mb-bg-raised text-mb-text-tertiary border border-mb-border">
                        {bundle.category}
                      </span>
                      <span className="text-2xs font-mono text-mb-text-tertiary">
                        {bundle.vectors.length} test vectors
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-mb-text">{bundle.name}</h4>
                    <p className="text-2xs text-mb-text-tertiary leading-relaxed">{bundle.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-7 mb-panel p-6 space-y-6 bg-mb-surface sticky top-20">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mb-border pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-mb-text flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-mb-text" />
                    <span>{activeResilienceBundle.name}</span>
                  </h3>
                  <p className="text-2xs font-mono text-mb-text-tertiary mt-0.5">
                    Endpoint: /api/v1/public/resilience/{activeResilienceBundle.id}
                  </p>
                </div>

                <button
                  onClick={() => handleCopyResilienceCurl(activeResilienceBundle.id)}
                  className="mb-btn-secondary inline-flex h-8 items-center px-3 text-xs font-mono"
                >
                  {copiedSlug === `resilience-${activeResilienceBundle.id}` ? (
                    <Check className="w-3.5 h-3.5 text-mb-success mr-1.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  <span>{copiedSlug === `resilience-${activeResilienceBundle.id}` ? "Copied Harness cURL" : "Copy Harness cURL"}</span>
                </button>
              </div>

              <div className="space-y-3">
                <span className="text-2xs font-mono text-mb-text-tertiary block">
                  Select Edge-Case Test Vector ({activeResilienceBundle.vectors.length} vectors available):
                </span>

                <div className="flex flex-wrap gap-2">
                  {activeResilienceBundle.vectors.map((v) => {
                    const isActive = v.id === activeVectorId;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setActiveVectorId(v.id)}
                        className={`px-3 py-1.5 rounded text-2xs font-mono font-medium transition-all border ${
                          isActive
                            ? "bg-mb-surface-active border-mb-text text-mb-text shadow-sm"
                            : "bg-mb-bg-raised border-mb-border text-mb-text-tertiary hover:border-mb-border-hover hover:text-mb-text"
                        }`}
                      >
                        {v.category} ({v.id})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 p-4 rounded-md bg-mb-bg-raised border border-mb-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-mb-text font-mono">Vector ID: {activeVector.id}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xs font-mono px-2 py-0.5 rounded bg-mb-surface border border-mb-border text-mb-text-secondary">
                      target: {activeVector.target || "body"}
                    </span>
                    <span className="text-2xs font-mono px-2 py-0.5 rounded bg-mb-surface border border-mb-border text-mb-text-tertiary">
                      hint: {activeVector.field_type_hint || "string"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-mb-text-secondary leading-relaxed">{activeVector.description}</p>

                <div className="p-3 rounded bg-mb-surface border border-mb-border font-mono text-2xs space-y-1">
                  <span className="text-mb-success font-semibold block">Expected Safe System Behavior:</span>
                  <p className="text-mb-text-secondary">{activeVector.expected_safe_behavior}</p>
                </div>

                {activeVector.expected_assertion && (
                  <div className="p-3 rounded bg-mb-surface border border-mb-border font-mono text-2xs space-y-1">
                    <span className="text-mb-text-tertiary font-semibold block uppercase tracking-wider text-[10px]">
                      Automated CI Assertion Object (JSON):
                    </span>
                    <pre className="text-mb-text-secondary text-[11px]">
                      {JSON.stringify(activeVector.expected_assertion, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-mono text-mb-text-tertiary">
                    Raw Test Vector Payload (Target: {activeVector.target || "body"}):
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const raw = typeof activeVector.payload === "object" ? JSON.stringify(activeVector.payload) : String(activeVector.payload);
                        navigator.clipboard.writeText(raw);
                        setCopiedSlug(`raw-${activeVector.id}`);
                        setTimeout(() => setCopiedSlug(null), 1800);
                      }}
                      className="mb-btn-secondary h-6 px-2 text-[10px] font-mono"
                    >
                      {copiedSlug === `raw-${activeVector.id}` ? "Copied" : "Copy Raw"}
                    </button>

                    <button
                      onClick={() => {
                        const b64 = activeVector.payload_b64 || Buffer.from(String(activeVector.payload)).toString("base64");
                        navigator.clipboard.writeText(b64);
                        setCopiedSlug(`b64-${activeVector.id}`);
                        setTimeout(() => setCopiedSlug(null), 1800);
                      }}
                      className="mb-btn-secondary h-6 px-2 text-[10px] font-mono"
                    >
                      {copiedSlug === `b64-${activeVector.id}` ? "Copied B64" : "Copy Base64 (WAF Safe)"}
                    </button>
                  </div>
                </div>

                <pre className="p-4 bg-mb-bg-raised border border-mb-border rounded-md font-mono text-xs text-mb-key max-h-48 overflow-y-auto leading-relaxed">
                  <code>
                    {typeof activeVector.payload === "object"
                      ? JSON.stringify(activeVector.payload, null, 2)
                      : String(activeVector.payload)}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: MOCKBIT ARENA (AI AGENT SUBSTRATE) */}
        {activeSection === "arena" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Arena World Selector Cards (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xs font-semibold text-mb-text uppercase tracking-wider">Select Arena World Ecosystem</h3>
              {ARENA_WORLDS.map((world) => {
                const isSelected = world.id === activeArenaWorldId;
                return (
                  <div
                    key={world.id}
                    onClick={() => {
                      setActiveArenaWorldId(world.id);
                      setCascadeResult(null);
                    }}
                    className={`mb-panel p-5 space-y-3 cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "border-mb-text bg-mb-surface shadow-mb-md"
                        : "hover:border-mb-border-hover bg-mb-bg"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-mono px-2 py-0.5 rounded bg-mb-bg-raised text-mb-text-tertiary border border-mb-border">
                        {world.category}
                      </span>
                      <span className="text-2xs font-mono text-mb-text-tertiary">
                        {world.systems.length} systems
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-mb-text flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-mb-text-tertiary" />
                        <span>{world.name}</span>
                      </h4>
                      <p className="text-2xs font-mono text-mb-text-tertiary mt-0.5">{world.tagline}</p>
                    </div>

                    <p className="text-2xs text-mb-text-tertiary leading-relaxed line-clamp-2">{world.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Right World Inspector & Event Engine (7 Cols) */}
            <div className="lg:col-span-7 mb-panel p-6 space-y-6 bg-mb-surface sticky top-20">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mb-border pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-mb-text flex items-center gap-2">
                    <Bot className="w-4 h-4 text-mb-text" />
                    <span>{activeArenaWorld.name}</span>
                  </h3>
                  <p className="text-2xs font-mono text-mb-text-tertiary mt-0.5">
                    World Endpoint: /api/v1/public/arena/{activeArenaWorld.id}
                  </p>
                </div>

                <button
                  onClick={() => handleCopyArenaCurl(activeArenaWorld.id)}
                  className="mb-btn-secondary inline-flex h-8 items-center px-3 text-xs font-mono"
                >
                  {copiedSlug === `arena-${activeArenaWorld.id}` ? (
                    <Check className="w-3.5 h-3.5 text-mb-success mr-1.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  <span>{copiedSlug === `arena-${activeArenaWorld.id}` ? "Copied World cURL" : "Copy World cURL"}</span>
                </button>
              </div>

              {/* Interconnected Systems Pill Cloud */}
              <div className="space-y-2">
                <span className="text-2xs font-mono text-mb-text-tertiary block">
                  Simulated Living Ecosystem Systems ({activeArenaWorld.systems.length} APIs):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeArenaWorld.systems.map((s, idx) => (
                    <span key={idx} className="text-2xs font-mono px-2 py-0.5 rounded bg-mb-bg-raised border border-mb-border text-mb-text font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* DETERMINISTIC EVENT CASCADE RUNNER */}
              <div className="p-4 rounded-md border border-mb-border bg-mb-bg-raised space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-mb-text flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-mb-text" />
                      <span>Mockbit Synthetic Event Runtime Layer 2</span>
                    </span>
                    <p className="text-2xs text-mb-text-tertiary mt-0.5">Executes multi-system event DAGs with distributed tracing & business invariants ($0 LLM token cost)</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-2xs font-mono text-mb-text-tertiary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dropChaosEvent}
                        onChange={(e) => setDropChaosEvent(e.target.checked)}
                        className="accent-mb-text"
                      />
                      <span>Chaos: Drop Webhook</span>
                    </label>

                    <button onClick={handleRunEventCascade} className="mb-btn-primary inline-flex h-8 items-center px-3 text-xs">
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      <span>Run Event Cascade</span>
                    </button>
                  </div>
                </div>

                {/* Event Cascade Output Log & Distributed Trace Flamegraph */}
                {cascadeResult && (
                  <div className="space-y-3 pt-3 border-t border-mb-border font-mono text-2xs">
                    <div className="flex flex-wrap items-center justify-between text-mb-text-tertiary gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5">
                          <span>World State:</span>
                          <code className={`font-bold px-1.5 py-0.5 rounded border text-[10px] ${cascadeResult.worldState === "RESOLVED" ? "bg-mb-surface text-mb-success border-mb-border" : "bg-mb-surface text-mb-warning border-mb-border"}`}>
                            {cascadeResult.worldState}
                          </code>
                        </span>

                        <span className="flex items-center gap-1.5">
                          <span>SHA-256 Digest:</span>
                          <code className="text-mb-text font-bold px-1 rounded bg-mb-surface border border-mb-border">{cascadeResult.executionHash.slice(0, 12)}...</code>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded border ${cascadeResult.invariantsPassed ? "bg-mb-surface text-mb-success border-mb-border" : "bg-mb-surface text-mb-warning border-mb-border"}`}>
                          {cascadeResult.invariantsPassed ? "✓ Business Invariants Passed" : `⚠️ ${cascadeResult.invariantFailuresCount} Invariants Violated`}
                        </span>

                        <button onClick={handleDownloadArtifact} className="mb-btn-secondary h-6 px-2 text-[10px] font-mono inline-flex items-center">
                          <Copy className="w-3 h-3 mr-1" />
                          <span>Export arena-run.json</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {cascadeResult.steps.map((step, idx) => (
                        <div key={idx} className="p-3 rounded bg-mb-surface border border-mb-border space-y-1.5">
                          <div className="flex items-center justify-between font-semibold text-mb-text">
                            <span className="text-mb-text-tertiary">Tick {step.tick}: {step.triggerEvent.event}</span>
                            <span className="text-2xs text-mb-text-disabled">{step.triggerEvent.event_id}</span>
                          </div>

                          {step.emittedEvents.length > 0 && (
                            <div className="pl-3 border-l border-mb-border space-y-1 text-[11px]">
                              <span className="text-mb-text-tertiary block">Emitted Child Events:</span>
                              {step.emittedEvents.map((childEvt, cIdx) => (
                                <div key={cIdx} className="text-mb-text-secondary flex items-center justify-between">
                                  <span>↳ {childEvt.event}</span>
                                  <span className="text-mb-text-disabled text-[10px]">parent: {childEvt.parent_event_id}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {step.invariantFailures.length > 0 && (
                            <div className="p-2 rounded bg-mb-bg-raised border border-mb-border text-mb-warning text-[11px] space-y-0.5">
                              {step.invariantFailures.map((f, fIdx) => (
                                <div key={fIdx}>⚠️ {f.reason}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mockbit Agent Index Telemetry Scorecard */}
              <div className="space-y-3 p-4 rounded-md bg-mb-bg-raised border border-mb-border">
                <span className="text-xs font-semibold text-mb-text flex items-center gap-2 border-b border-mb-border pb-2">
                  <Cpu className="w-3.5 h-3.5 text-mb-text-tertiary" />
                  <span>Mockbit Agent Index™ Telemetry Benchmark Scorecard</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-2xs font-mono text-center">
                  <div className="p-2 rounded bg-mb-surface border border-mb-border">
                    <span className="text-mb-text-tertiary block text-[10px]">Tool Correct</span>
                    <span className="text-mb-success font-bold text-xs">{activeArenaWorld.agent_index_rubric.tool_correctness}%</span>
                  </div>
                  <div className="p-2 rounded bg-mb-surface border border-mb-border">
                    <span className="text-mb-text-tertiary block text-[10px]">Workflow Done</span>
                    <span className="text-mb-text font-bold text-xs">{activeArenaWorld.agent_index_rubric.workflow_completion}%</span>
                  </div>
                  <div className="p-2 rounded bg-mb-surface border border-mb-border">
                    <span className="text-mb-text-tertiary block text-[10px]">Recovery Intel</span>
                    <span className="text-mb-text font-bold text-xs">{activeArenaWorld.agent_index_rubric.recovery_intelligence}%</span>
                  </div>
                  <div className="p-2 rounded bg-mb-surface border border-mb-border">
                    <span className="text-mb-text-tertiary block text-[10px]">State Efficiency</span>
                    <span className="text-mb-text font-bold text-xs">{activeArenaWorld.agent_index_rubric.state_efficiency}%</span>
                  </div>
                  <div className="p-2 rounded bg-mb-surface border border-mb-border">
                    <span className="text-mb-text-tertiary block text-[10px]">Safety Score</span>
                    <span className="text-mb-success font-bold text-xs">{activeArenaWorld.agent_index_rubric.safety_score}%</span>
                  </div>
                </div>
              </div>

              {/* Universal Python Agent SDK Integration Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-mono text-mb-text-tertiary">
                    Universal Agent SDK Code Snippet (Python):
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeArenaWorld.sample_python_sdk);
                      setCopiedSlug(`sdk-${activeArenaWorld.id}`);
                      setTimeout(() => setCopiedSlug(null), 1800);
                    }}
                    className="mb-btn-secondary h-6 px-2 text-[10px] font-mono"
                  >
                    {copiedSlug === `sdk-${activeArenaWorld.id}` ? "Copied SDK" : "Copy Python SDK"}
                  </button>
                </div>

                <pre className="p-4 bg-mb-bg-raised border border-mb-border rounded-md font-mono text-xs text-mb-key max-h-48 overflow-y-auto leading-relaxed">
                  <code>{activeArenaWorld.sample_python_sdk}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: ENTERPRISE KNOWLEDGE PACKS */}
        {activeSection === "knowledge" && (
          <div className="space-y-8">
            <div className="space-y-2 text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-mb-surface border border-mb-border text-2xs font-mono text-mb-text-tertiary">
                <Cpu className="w-3 h-3 text-mb-text" />
                <span>Offline Claude Pre-Compiled Knowledge Assets</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-mb-text">Enterprise Knowledge Packs</h2>
              <p className="text-xs text-mb-text-secondary">
                Pre-compiled, deterministic knowledge assets for reusable business behaviors, production failure modes, and agent golden strategy playbooks ($0 runtime AI cost).
              </p>
            </div>

            {/* Enterprise Behaviors Grid */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-mb-text font-mono flex items-center gap-2">
                <Layers className="w-4 h-4 text-mb-text-tertiary" />
                <span>1. Reusable Enterprise Behaviors Library ({ENTERPRISE_BEHAVIORS.length})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ENTERPRISE_BEHAVIORS.map((b) => (
                  <div key={b.behavior_id} className="mb-panel p-4 bg-mb-surface border border-mb-border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-mb-text">{b.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mb-bg-raised text-mb-text-tertiary border border-mb-border uppercase">
                        {b.domain}
                      </span>
                    </div>

                    <p className="text-2xs text-mb-text-secondary leading-relaxed">{b.description}</p>

                    <div className="space-y-1 font-mono text-[10px]">
                      <div className="text-mb-text-tertiary">Trigger: <span className="text-mb-text font-bold">{b.trigger}</span></div>
                      <div className="text-mb-text-tertiary">Steps: <span className="text-mb-text">{b.steps.join(" ➔ ")}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Failure Atlas Grid */}
            <div className="space-y-4 pt-6 border-t border-mb-border">
              <h3 className="text-sm font-semibold text-mb-text font-mono flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-mb-text-tertiary" />
                <span>2. Failure Atlas — Software Failure Modes ({FAILURE_ATLAS.length})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FAILURE_ATLAS.map((f) => (
                  <div key={f.failure_id} className="mb-panel p-4 bg-mb-surface border border-mb-border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-mb-text">{f.failure_id}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mb-bg-raised text-mb-text-tertiary border border-mb-border">
                        {f.category}
                      </span>
                    </div>

                    <div className="text-2xs text-mb-text-secondary font-mono">Cause: {f.cause}</div>

                    <div className="space-y-1 font-mono text-[10px]">
                      <div className="text-mb-text-tertiary">Symptoms: <span className="text-mb-text">{f.symptoms.join(", ")}</span></div>
                      <div className="text-mb-text-tertiary">Mitigation: <span className="text-mb-success font-semibold">{f.mitigation_rule}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Playbooks & Semantics */}
            <div className="space-y-4 pt-6 border-t border-mb-border">
              <h3 className="text-sm font-semibold text-mb-text font-mono flex items-center gap-2">
                <Bot className="w-4 h-4 text-mb-text-tertiary" />
                <span>3. Agent Golden Strategy Playbooks ({AGENT_BENCHMARKS.length})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AGENT_BENCHMARKS.map((bm) => (
                  <div key={bm.benchmark_id} className="mb-panel p-4 bg-mb-surface border border-mb-border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-mb-text">{bm.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mb-bg-raised text-mb-text-tertiary border border-mb-border">
                        Max Ticks: {bm.max_ticks}
                      </span>
                    </div>

                    <p className="text-2xs text-mb-text-secondary">{bm.description}</p>

                    <div className="font-mono text-[10px] text-mb-text-tertiary">
                      Optimal Sequence: <span className="text-mb-text">{bm.optimal_path.join(" ➔ ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
