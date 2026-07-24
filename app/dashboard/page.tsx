"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { exportToOpenAPI, exportToPostman, parseFileToEndpoints } from "@/lib/exporters";
import CodeSnippets from "@/components/CodeSnippets";
import { DragDropOverlay } from "@/components/DragDropOverlay";
import { StoreInspectorDrawer } from "@/components/StoreInspectorDrawer";
import { ActivityLogDrawer } from "@/components/ActivityLogDrawer";
import {
  Plus,
  Copy,
  Check,
  Play,
  Trash2,
  Layers,
  Code,
  FileCode,
  Download,
  Upload,
  UploadCloud,
  Database,
  Activity,
  GitBranch,
  Sliders,
  Camera,
} from "lucide-react";

interface Endpoint {
  id: string;
  name: string;
  slug: string;
  response_type: "object" | "array";
  array_length: number;
  status_code: number;
  latency_ms: number;
  seed?: number;
  error_rate?: number;
  error_status?: number;
  rules?: any[];
  schema_json: any;
  created_at: string;
}

export default function DashboardPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBranch, setActiveBranch] = useState("main");
  const [activeScenario, setActiveScenario] = useState("default");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Copy URL State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Test Runner Drawer State
  const [testEndpoint, setTestEndpoint] = useState<Endpoint | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);

  // Code Snippet Drawer State
  const [snippetEndpoint, setSnippetEndpoint] = useState<Endpoint | null>(null);

  // Store Inspector Drawer State
  const [inspectorEndpoint, setInspectorEndpoint] = useState<Endpoint | null>(null);

  // Activity Log Drawer State
  const [activityLogEndpoint, setActivityLogEndpoint] = useState<Endpoint | null>(null);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<Endpoint | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleUpdateEndpointStore = (updatedEp: Endpoint) => {
    const updatedList = endpoints.map((e) => (e.id === updatedEp.id ? updatedEp : e));
    setEndpoints(updatedList);
    setInspectorEndpoint(updatedEp);
    try {
      localStorage.setItem("mockbit_demo_endpoints", JSON.stringify(updatedList));
    } catch {}
  };

  useEffect(() => {
    loadEndpoints();
  }, []);

  const loadEndpoints = async () => {
    setLoading(true);
    let loadedEndpoints: Endpoint[] = [];

    // 1. Load LocalStorage Endpoints
    try {
      const localData = JSON.parse(localStorage.getItem("mockbit_demo_endpoints") || "[]");
      loadedEndpoints = [...localData];
    } catch (err) {
      console.warn("Failed to load local endpoints:", err);
    }

    // 2. Load Supabase DB Endpoints (if configured)
    try {
      const { data, error } = await supabase
        .from("endpoints")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const existingIds = new Set(loadedEndpoints.map((e) => e.id));
        data.forEach((ep: any) => {
          if (!existingIds.has(ep.id)) {
            loadedEndpoints.push(ep);
          }
        });
      }
    } catch {
      // Offline / unconfigured DB mode
    }

    // Default sample if empty
    if (loadedEndpoints.length === 0) {
      const defaultSample: Endpoint = {
        id: "demo-1",
        name: "Sample Orders API",
        slug: "orders",
        response_type: "array",
        array_length: 5,
        status_code: 200,
        latency_ms: 0,
        schema_json: {
          id: "ord_9824a",
          customer: "Sarah Connor",
          total: 149.99,
          status: "shipped",
        },
        created_at: new Date().toISOString(),
      };
      loadedEndpoints.push(defaultSample);
      try {
        localStorage.setItem("mockbit_demo_endpoints", JSON.stringify(loadedEndpoints));
      } catch {}
    }

    setEndpoints(loadedEndpoints);
    setLoading(false);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExportWorkspace = () => {
    const backupObj = {
      mockbit_workspace: true,
      version: "0.7.0",
      exported_at: new Date().toISOString(),
      endpoints,
    };
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mockbit-workspace-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Workspace exported successfully");
  };

  const handleFileDrop = (content: string, fileName: string) => {
    try {
      const importedSpecs = parseFileToEndpoints(content, fileName);
      if (!importedSpecs || importedSpecs.length === 0) return;

      const newEndpoints: Endpoint[] = importedSpecs.map((spec: any, idx: number) => ({
        id: spec.id || `ep-${Date.now()}-${idx}`,
        name: spec.name || "Imported API",
        slug: spec.slug || `api-${Date.now()}-${idx}`,
        response_type: spec.response_type || "array",
        array_length: spec.array_length || 5,
        status_code: spec.status_code || 200,
        latency_ms: spec.latency_ms || 0,
        seed: spec.seed,
        error_rate: spec.error_rate,
        error_status: spec.error_status,
        rules: spec.rules,
        schema_json: spec.schema_json || {},
        created_at: new Date().toISOString(),
      }));

      const existingSlugs = new Set(endpoints.map((e) => e.slug));
      const filteredNew = newEndpoints.filter((e) => !existingSlugs.has(e.slug));
      const updatedList = [...filteredNew, ...endpoints];

      setEndpoints(updatedList);
      try {
        localStorage.setItem("mockbit_demo_endpoints", JSON.stringify(updatedList));
      } catch {}

      showToast(`Imported ${newEndpoints.length} endpoint(s) from ${fileName}`);
    } catch (err: any) {
      showToast(`Failed to parse ${fileName}: ${err.message}`);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) handleFileDrop(content, file.name);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const getEndpointUrl = (slug: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/v1/demo/${slug}`;
    }
    return `http://localhost:3000/api/v1/demo/${slug}`;
  };

  const handleCopyUrl = (id: string, slug: string) => {
    const url = getEndpointUrl(slug);
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunTest = async (endpoint: Endpoint) => {
    setTestEndpoint(endpoint);
    setTestLoading(true);
    setTestResponse(null);

    const url = getEndpointUrl(endpoint.slug);

    try {
      const res = await fetch(url);
      const data = await res.json();
      setTestResponse(data);
    } catch {
      setTestResponse({ error: "Failed to fetch endpoint response" });
    } finally {
      setTestLoading(false);
    }
  };

  const handleDownloadOpenAPI = (endpoint: Endpoint) => {
    const jsonStr = exportToOpenAPI(endpoint);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${endpoint.slug}-openapi.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPostman = (endpoint: Endpoint) => {
    const jsonStr = exportToPostman(endpoint);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${endpoint.slug}-postman.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    try {
      const updated = endpoints.filter((e) => e.id !== deleteTarget.id);
      setEndpoints(updated);
      try {
        localStorage.setItem("mockbit_demo_endpoints", JSON.stringify(updated));
      } catch {}

      try {
        await supabase.from("endpoints").delete().eq("id", deleteTarget.id);
      } catch {}
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-mb-bg text-mb-text flex flex-col font-sans">
      {/* Drag & Drop File Import Overlay */}
      <DragDropOverlay onFileDrop={handleFileDrop} />

      {/* Hidden File Input Trigger */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".json,.yaml,.yml"
        className="hidden"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 mb-panel px-4 py-3 text-xs font-medium text-mb-text shadow-mb-md flex items-center gap-2 animate-mb-fade-up">
          <span className="h-2 w-2 rounded-full bg-mb-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <nav className="border-b border-mb-border bg-mb-bg/90 backdrop-saturate-150 px-6 h-14 flex items-center justify-between sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2 group">
          <MarkIcon />
          <span className="font-semibold text-sm tracking-tight text-mb-text">mockbit</span>
          <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-mb-bg-raised text-mb-text-tertiary border border-mb-border">
            v0.8
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mb-btn-secondary inline-flex h-8 items-center px-3 text-xs"
            title="Import JSON / OpenAPI / Postman file"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5 text-mb-text-tertiary" />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            onClick={handleExportWorkspace}
            className="mb-btn-secondary inline-flex h-8 items-center px-3 text-xs"
            title="Export Full Workspace Backup"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-mb-text-tertiary" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <Link
            href="/dashboard/endpoints/new"
            className="mb-btn-primary inline-flex h-8 items-center px-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Create Endpoint</span>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-mb-border pb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-mb-text">Endpoints Dashboard</h1>
            <p className="text-sm text-mb-text-secondary mt-1">
              Manage stateful REST mock routes and inspect real-time execution logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mb-btn-secondary inline-flex h-9 items-center px-3.5 text-xs"
            >
              <UploadCloud className="w-4 h-4 mr-1.5 text-mb-text-tertiary" />
              <span>Import File</span>
            </button>

            <Link
              href="/dashboard/endpoints/new"
              className="mb-btn-primary inline-flex h-9 items-center px-4 text-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>New Endpoint</span>
            </Link>
          </div>
        </div>

        {/* Branch & Scenario Environment Selector */}
        <div className="mb-panel p-3 px-4 flex flex-wrap items-center justify-between gap-4 text-xs bg-mb-surface">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-mb-text-tertiary" />
              <span className="text-2xs text-mb-text-tertiary font-medium">Active Branch:</span>
              <select
                value={activeBranch}
                onChange={(e) => setActiveBranch(e.target.value)}
                className="bg-mb-bg-raised border border-mb-border rounded px-2.5 py-1 text-2xs text-mb-text font-mono"
              >
                <option value="main">main</option>
                <option value="feature-auth">feature-auth</option>
                <option value="pr-104">pr-104 (PR Scope)</option>
                <option value="qa-staging">qa-staging</option>
              </select>
            </div>

            <div className="flex items-center gap-2 border-l border-mb-border pl-4">
              <Sliders className="w-3.5 h-3.5 text-mb-text-tertiary" />
              <span className="text-2xs text-mb-text-tertiary font-medium">Active Scenario Preset:</span>
              <select
                value={activeScenario}
                onChange={(e) => setActiveScenario(e.target.value)}
                className="bg-mb-bg-raised border border-mb-border rounded px-2.5 py-1 text-2xs text-mb-text font-mono"
              >
                <option value="default">Default State</option>
                <option value="expired-card">Expired Card State</option>
                <option value="empty-inventory">Empty Inventory State</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-2xs text-mb-text-tertiary">
            <span className="font-mono">X-Mockbit-Branch: {activeBranch}</span>
          </div>
        </div>

        {/* Endpoints Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 mb-panel opacity-50 animate-pulse" />
            ))}
          </div>
        ) : endpoints.length === 0 ? (
          <div className="text-center py-16 px-4 mb-panel space-y-4">
            <Layers className="w-10 h-10 text-mb-text-disabled mx-auto" />
            <h3 className="text-base font-medium text-mb-text">No endpoints created yet</h3>
            <p className="text-xs text-mb-text-secondary max-w-sm mx-auto">
              Create your first mock endpoint to generate instant API URLs and test state mutations.
            </p>
            <Link
              href="/dashboard/endpoints/new"
              className="mb-btn-primary inline-flex h-8 items-center px-3 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Create Endpoint</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {endpoints.map((ep) => {
              const url = getEndpointUrl(ep.slug);
              return (
                <div
                  key={ep.id}
                  className="mb-panel p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-sm text-mb-text tracking-tight">{ep.name}</h3>
                        <span className="text-xs text-mb-text-tertiary font-mono">/api/v1/demo/{ep.slug}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className="px-2 py-0.5 rounded bg-mb-bg-raised text-mb-text-secondary border border-mb-border text-2xs font-mono">
                          {ep.status_code || 200} OK
                        </span>
                        {ep.error_rate && ep.error_rate > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-mb-bg-raised text-mb-text-tertiary border border-mb-border text-2xs font-mono">
                            Flaky ({ep.error_rate}%)
                          </span>
                        ) : null}
                        {ep.seed !== undefined && ep.seed !== null ? (
                          <span className="px-2 py-0.5 rounded bg-mb-bg-raised text-mb-text-tertiary border border-mb-border text-2xs font-mono">
                            Seeded
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* URL Copy Bar */}
                    <div className="flex items-center bg-mb-bg-raised border border-mb-border rounded-md p-1.5 pl-3 text-xs">
                      <span className="font-mono text-mb-text-secondary truncate flex-1">{url}</span>
                      <button
                        onClick={() => handleCopyUrl(ep.id, ep.slug)}
                        className="px-2 py-1 rounded bg-mb-surface hover:bg-mb-surface-hover text-mb-text-secondary hover:text-mb-text transition-colors flex items-center gap-1 shrink-0 ml-2 text-2xs font-mono border border-mb-border"
                      >
                        {copiedId === ep.id ? (
                          <>
                            <Check className="w-3 h-3 text-mb-success" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-mb-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleRunTest(ep)}
                        className="mb-btn-secondary inline-flex h-7 items-center px-2.5 text-xs"
                      >
                        <Play className="w-3 h-3 mr-1 text-mb-text-tertiary" />
                        <span>Test</span>
                      </button>

                      <button
                        onClick={() => setInspectorEndpoint(ep)}
                        className="mb-btn-secondary inline-flex h-7 items-center px-2.5 text-xs"
                        title="Inspect Live Store Records"
                      >
                        <Database className="w-3 h-3 mr-1 text-mb-text-tertiary" />
                        <span>Data</span>
                      </button>

                      <button
                        onClick={() => setActivityLogEndpoint(ep)}
                        className="mb-btn-secondary inline-flex h-7 items-center px-2.5 text-xs"
                        title="Inspect Incoming HTTP Traffic"
                      >
                        <Activity className="w-3 h-3 mr-1 text-mb-text-tertiary" />
                        <span>Logs</span>
                      </button>

                      <button
                        onClick={() => setSnippetEndpoint(ep)}
                        className="mb-btn-secondary inline-flex h-7 items-center px-2.5 text-xs"
                        title="Code Snippets"
                      >
                        <Code className="w-3 h-3 mr-1 text-mb-text-tertiary" />
                        <span>Code</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownloadOpenAPI(ep)}
                        className="p-1 rounded text-mb-text-tertiary hover:text-mb-text hover:bg-mb-surface-hover transition-colors text-xs"
                        title="Export OpenAPI Spec"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownloadPostman(ep)}
                        className="p-1 rounded text-mb-text-tertiary hover:text-mb-text hover:bg-mb-surface-hover transition-colors text-xs"
                        title="Export Postman Collection"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(ep)}
                        className="p-1 rounded text-mb-text-tertiary hover:text-mb-error hover:bg-mb-surface-hover transition-colors"
                        title="Delete Endpoint"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Code Snippets Drawer */}
      {snippetEndpoint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="mb-panel max-w-2xl w-full p-6 space-y-4 shadow-mb-md relative">
            <div className="flex items-center justify-between border-b border-mb-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-mb-text">{snippetEndpoint.name} Integration</h3>
                <p className="text-2xs text-mb-text-tertiary">Ready-to-use client code</p>
              </div>
              <button
                onClick={() => setSnippetEndpoint(null)}
                className="mb-btn-secondary inline-flex h-7 items-center px-2.5 text-xs"
              >
                Close
              </button>
            </div>

            <CodeSnippets url={getEndpointUrl(snippetEndpoint.slug)} endpoint={snippetEndpoint} />
          </div>
        </div>
      )}

      {/* Test Runner Drawer */}
      {testEndpoint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="mb-panel max-w-2xl w-full p-6 space-y-4 shadow-mb-md relative">
            <div className="flex items-center justify-between border-b border-mb-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-mb-text flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 text-mb-text-tertiary" />
                  <span>Test Runner — {testEndpoint.name}</span>
                </h3>
                <p className="text-2xs font-mono text-mb-text-tertiary mt-0.5">{getEndpointUrl(testEndpoint.slug)}</p>
              </div>
              <button
                onClick={() => setTestEndpoint(null)}
                className="mb-btn-secondary inline-flex h-7 items-center px-2.5 text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-mb-text-tertiary">
                <span>Response Output</span>
                <span className="font-mono text-mb-success">HTTP {testEndpoint.status_code || 200} OK</span>
              </div>
              <div className="bg-mb-bg-raised border border-mb-border rounded-md p-4 font-mono text-xs text-mb-text-secondary max-h-80 overflow-y-auto">
                {testLoading ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-mb-text-tertiary">
                    <span className="w-2 h-2 rounded-full bg-mb-text-tertiary animate-ping" />
                    <span>Executing request...</span>
                  </div>
                ) : (
                  <pre>{JSON.stringify(testResponse, null, 2)}</pre>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="mb-panel max-w-md w-full p-6 space-y-4 shadow-mb-md">
            <h3 className="text-base font-semibold text-mb-text">Delete Endpoint?</h3>
            <p className="text-xs text-mb-text-secondary leading-relaxed">
              Are you sure you want to delete <strong className="text-mb-text">{deleteTarget.name}</strong>? Any app
              consuming <code className="text-mb-text-tertiary font-mono">/api/v1/demo/{deleteTarget.slug}</code> will receive a 404.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="mb-btn-secondary inline-flex h-8 items-center px-3 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="bg-mb-error text-black font-medium inline-flex h-8 items-center px-3 text-xs rounded-md transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete Endpoint"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Store Inspector Drawer */}
      {inspectorEndpoint && (
        <StoreInspectorDrawer
          endpoint={inspectorEndpoint}
          onClose={() => setInspectorEndpoint(null)}
          onUpdateEndpoint={handleUpdateEndpointStore}
        />
      )}

      {/* Activity Log Drawer */}
      {activityLogEndpoint && (
        <ActivityLogDrawer
          endpoint={activityLogEndpoint}
          onClose={() => setActivityLogEndpoint(null)}
        />
      )}
    </div>
  );
}

function MarkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="var(--mb-border-hover)" />
      <path
        d="M7 15V9L12 12.5L17 9V15"
        stroke="var(--mb-text)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
