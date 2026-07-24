"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Command,
  Upload,
  Download,
  Activity,
  Code2,
  Database,
  Terminal,
  FileCode,
  FileSpreadsheet,
  Play,
  Sparkles,
} from "lucide-react";
import { ImportFormatId } from "@/components/UnifiedImportModal";
import { ExportFormatId } from "@/components/UnifiedExportModal";

interface StudioCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImportFormat: (formatId: ImportFormatId) => void;
  onSelectExportFormat: (exportId: ExportFormatId) => void;
  onTriggerTool: (toolId: "inspector" | "proxy" | "sdk" | "graph" | "webhook" | "websocket") => void;
}

export function StudioCommandPalette({
  isOpen,
  onClose,
  onSelectImportFormat,
  onSelectExportFormat,
  onTriggerTool,
}: StudioCommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or state trigger
        }
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: "imp_openapi", label: "Import OpenAPI 3.0 / Swagger", category: "Import", action: () => onSelectImportFormat("openapi") },
    { id: "imp_postman", label: "Import Postman Collection v2.1", category: "Import", action: () => onSelectImportFormat("postman") },
    { id: "imp_curl", label: "Import cURL Command String", category: "Import", action: () => onSelectImportFormat("curl") },
    { id: "imp_insomnia", label: "Import Insomnia / Bruno Workspace", category: "Import", action: () => onSelectImportFormat("insomnia") },
    { id: "imp_har", label: "Import Chrome/Firefox HAR Archive", category: "Import", action: () => onSelectImportFormat("har") },
    { id: "imp_wiremock", label: "Import WireMock Stub Mappings", category: "Import", action: () => onSelectImportFormat("wiremock") },
    { id: "imp_graphql", label: "Import GraphQL Schema (SDL)", category: "Import", action: () => onSelectImportFormat("graphql") },
    { id: "imp_ts", label: "Import TypeScript Interface / Type", category: "Import", action: () => onSelectImportFormat("typescript") },
    { id: "imp_jsonschema", label: "Import JSON Schema (v4/v7)", category: "Import", action: () => onSelectImportFormat("jsonschema") },
    { id: "imp_csv", label: "Import CSV Data Table", category: "Import", action: () => onSelectImportFormat("csv") },
    { id: "imp_db", label: "Import Database DDL (Postgres/MySQL)", category: "Import", action: () => onSelectImportFormat("db") },
    { id: "exp_openapi", label: "Export OpenAPI 3.0 JSON Spec", category: "Export", action: () => onSelectExportFormat("openapi") },
    { id: "exp_postman", label: "Export Postman Collection v2.1", category: "Export", action: () => onSelectExportFormat("postman") },
    { id: "exp_html", label: "Export Standalone HTML Test Bench", category: "Export", action: () => onSelectExportFormat("html_runner") },
    { id: "exp_markdown", label: "Export Markdown API Docs", category: "Export", action: () => onSelectExportFormat("markdown") },
    { id: "exp_sqlddl", label: "Export SQL CREATE TABLE DDL", category: "Export", action: () => onSelectExportFormat("sql_ddl") },
    { id: "tool_inspector", label: "Open Real-Time Request Inspector", category: "Tool", action: () => onTriggerTool("inspector") },
    { id: "tool_proxy", label: "Open Live HTTP Traffic Proxy Recorder", category: "Tool", action: () => onTriggerTool("proxy") },
    { id: "tool_webhook", label: "Dispatch Outgoing Webhook Event (HMAC Signed)", category: "Tool", action: () => onTriggerTool("webhook") },
    { id: "tool_websocket", label: "Open Mock WebSocket Socket Test Bench", category: "Tool", action: () => onTriggerTool("websocket") },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()) || a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-24 p-4">
      <div className="bg-mb-surface border border-mb-border rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        <div className="p-3 border-b border-mb-border flex items-center gap-2.5">
          <Search className="w-4 h-4 text-mb-text-tertiary" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or format... (e.g. 'postman', 'openapi', 'inspector')"
            className="w-full bg-transparent text-xs text-mb-text focus:outline-none placeholder:text-mb-text-tertiary"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-3xs font-mono text-mb-text-tertiary bg-mb-bg border border-mb-border rounded">
            ESC
          </kbd>
        </div>

        <div className="p-2 max-h-72 overflow-y-auto space-y-1">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.action();
                onClose();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-mb-surface-hover text-left transition-colors group text-xs text-mb-text"
            >
              <span>{item.label}</span>
              <span className="text-3xs font-mono text-mb-text-tertiary bg-mb-bg px-1.5 py-0.5 rounded border border-mb-border">
                {item.category}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="p-6 text-center text-xs text-mb-text-tertiary font-mono">
              No matching commands found for &quot;{query}&quot;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
