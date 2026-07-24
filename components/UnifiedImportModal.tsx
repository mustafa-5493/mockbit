"use client";

import { useState } from "react";
import {
  X,
  Search,
  Upload,
  FileCode,
  Terminal,
  Activity,
  Sparkles,
  Database,
  Code2,
  FileSpreadsheet,
  Check,
} from "lucide-react";

export type ImportFormatId =
  | "openapi"
  | "postman"
  | "insomnia"
  | "har"
  | "wiremock"
  | "graphql"
  | "typescript"
  | "jsonschema"
  | "protobuf"
  | "curl"
  | "csv"
  | "db"
  | "proxy"
  | "mockapi";

interface UnifiedImportModalProps {
  onClose: () => void;
  onSelectFormat: (formatId: ImportFormatId) => void;
}

export function UnifiedImportModal({ onClose, onSelectFormat }: UnifiedImportModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "file" | "text" | "live">("all");
  const [dragging, setDragging] = useState(false);

  const importOptions: Array<{
    id: ImportFormatId;
    title: string;
    description: string;
    category: "file" | "text" | "live";
    icon: any;
    badge?: string;
  }> = [
    {
      id: "openapi",
      title: "OpenAPI 3.0 / Swagger",
      description: "Import REST API schema from .json or .yaml OpenAPI specifications",
      category: "file",
      icon: FileCode,
      badge: "Standard",
    },
    {
      id: "postman",
      title: "Postman Collection v2.1",
      description: "Import endpoints, methods, and sample payloads from *.postman_collection.json",
      category: "file",
      icon: FileCode,
      badge: "Popular",
    },
    {
      id: "insomnia",
      title: "Insomnia & Bruno Workspace",
      description: "Import workspace exports from Insomnia v4/v5 or Bruno collections",
      category: "file",
      icon: FileCode,
    },
    {
      id: "har",
      title: "Chrome / Firefox HAR Archive",
      description: "Convert recorded browser network traffic (*.har) directly into mock endpoints",
      category: "file",
      icon: Activity,
      badge: "Traffic",
    },
    {
      id: "wiremock",
      title: "WireMock Stub Mappings",
      description: "Import enterprise Java/Spring WireMock stub mapping files (mappings/*.json)",
      category: "file",
      icon: FileCode,
    },
    {
      id: "graphql",
      title: "GraphQL Schema (SDL)",
      description: "Import type definitions from .graphql or .gql schema files",
      category: "file",
      icon: Code2,
    },
    {
      id: "typescript",
      title: "TypeScript Interface / Type",
      description: "Extract mock fields from TypeScript interface or type declarations (.ts / .tsx)",
      category: "file",
      icon: Code2,
    },
    {
      id: "jsonschema",
      title: "JSON Schema (v4/v7/2020-12)",
      description: "Import W3C/IETF JSON Schema $schema specification objects",
      category: "file",
      icon: FileCode,
    },
    {
      id: "protobuf",
      title: "Google Protocol Buffers (.proto)",
      description: "Import gRPC service message definitions from .proto schema files",
      category: "file",
      icon: Code2,
      badge: "gRPC",
    },
    {
      id: "curl",
      title: "Terminal cURL Command",
      description: "Parse curl -X POST '...' strings directly into mock endpoint definitions",
      category: "text",
      icon: Terminal,
      badge: "Instant",
    },
    {
      id: "csv",
      title: "CSV Data Table",
      description: "Import schema and sample datasets from .csv file columns",
      category: "file",
      icon: FileSpreadsheet,
    },
    {
      id: "db",
      title: "Database DDL Introspector",
      description: "Parse PostgreSQL, MySQL, or SQLite CREATE TABLE DDL DDL statements",
      category: "live",
      icon: Database,
    },
    {
      id: "proxy",
      title: "Live HTTP Proxy Recorder",
      description: "Proxy live HTTP requests and record target server responses in real-time",
      category: "live",
      icon: Activity,
      badge: "Live",
    },
    {
      id: "mockapi",
      title: "MockAPI.io Migration",
      description: "Import schemas and resource endpoints from MockAPI.io projects",
      category: "text",
      icon: Sparkles,
    },
  ];

  const filteredOptions = importOptions.filter((opt) => {
    const matchesTab = activeTab === "all" || opt.category === activeTab;
    const matchesSearch =
      opt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    if (name.endsWith(".har")) onSelectFormat("har");
    else if (name.endsWith(".graphql") || name.endsWith(".gql")) onSelectFormat("graphql");
    else if (name.endsWith(".ts") || name.endsWith(".tsx")) onSelectFormat("typescript");
    else if (name.endsWith(".csv")) onSelectFormat("csv");
    else if (name.includes("postman")) onSelectFormat("postman");
    else if (name.includes("insomnia")) onSelectFormat("insomnia");
    else if (name.includes("wiremock")) onSelectFormat("wiremock");
    else onSelectFormat("openapi");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-mb-surface border border-mb-border rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-mb-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-mb-text flex items-center gap-2">
              <Upload className="w-5 h-5 text-mb-text" />
              Universal Import Hub
            </h2>
            <p className="text-2xs text-mb-text-tertiary mt-0.5">
              Select or drop any file format, cURL command, or live stream to populate Mockbit Studio
            </p>
          </div>
          <button onClick={onClose} className="text-mb-text-tertiary hover:text-mb-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag & Drop Quick Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`mx-5 mt-4 p-4 border-2 border-dashed rounded-lg text-center transition-colors ${
            dragging ? "border-mb-text bg-mb-surface-active" : "border-mb-border bg-mb-bg/50 hover:border-mb-border-hover"
          }`}
        >
          <p className="text-xs font-medium text-mb-text">
            Drop any file here (<code className="font-mono text-2xs text-mb-text-secondary">.json, .har, .graphql, .ts, .csv</code>)
          </p>
          <p className="text-2xs text-mb-text-tertiary mt-0.5">Mockbit will auto-detect and parse the format instantly</p>
        </div>

        {/* Search & Tabs Toolbar */}
        <div className="p-5 pb-3 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-mb-text-tertiary absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 12 formats... try 'postman', 'curl', 'graphql', or 'har'"
              className="w-full bg-mb-bg border border-mb-border rounded-md pl-9 pr-4 py-2 text-xs text-mb-text focus:outline-none focus:border-mb-border-hover"
            />
          </div>

          <div className="flex items-center gap-1 border-b border-mb-border pb-2">
            {[
              { id: "all", label: "All Formats (12)" },
              { id: "file", label: "File Specifications" },
              { id: "text", label: "cURL & Text" },
              { id: "live", label: "Live Connections" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-mb-surface-hover text-mb-text border border-mb-border"
                    : "text-mb-text-tertiary hover:text-mb-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Formats Grid List */}
        <div className="p-5 pt-0 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  onSelectFormat(opt.id);
                  onClose();
                }}
                className="flex items-start gap-3 p-3 rounded-lg border border-mb-border bg-mb-bg/40 hover:bg-mb-surface-hover hover:border-mb-border-hover text-left transition-colors group"
              >
                <div className="p-2 rounded-md bg-mb-surface border border-mb-border group-hover:border-mb-text-tertiary transition-colors shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-mb-text" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-mb-text truncate">{opt.title}</span>
                    {opt.badge && (
                      <span className="text-3xs font-mono font-semibold px-1.5 py-0.5 rounded bg-mb-surface border border-mb-border text-mb-text-tertiary">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-3xs text-mb-text-tertiary line-clamp-2 mt-0.5 leading-snug">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
