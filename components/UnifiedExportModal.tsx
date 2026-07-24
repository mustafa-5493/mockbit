"use client";

import { useState } from "react";
import {
  X,
  Share2,
  FileCode,
  FileSpreadsheet,
  Code2,
  Database,
  Play,
  Check,
  Download,
} from "lucide-react";

export type ExportFormatId =
  | "openapi"
  | "postman"
  | "markdown"
  | "html_runner"
  | "sql_ddl"
  | "data_export"
  | "sdk_code";

interface UnifiedExportModalProps {
  onClose: () => void;
  onSelectExport: (exportId: ExportFormatId) => void;
}

export function UnifiedExportModal({ onClose, onSelectExport }: UnifiedExportModalProps) {
  const exportOptions: Array<{
    id: ExportFormatId;
    title: string;
    description: string;
    category: "specs" | "docs" | "data" | "code";
    icon: any;
    badge?: string;
  }> = [
    {
      id: "openapi",
      title: "OpenAPI 3.0 Specification",
      description: "Download machine-readable OpenAPI 3.0 spec in JSON format",
      category: "specs",
      icon: FileCode,
      badge: "Standard",
    },
    {
      id: "postman",
      title: "Postman Collection v2.1",
      description: "Export collection JSON ready to import directly into Postman or Insomnia",
      category: "specs",
      icon: FileCode,
      badge: "Popular",
    },
    {
      id: "html_runner",
      title: "Interactive HTML Test Bench",
      description: "Download standalone single-file web runner (${slug}_test_bench.html)",
      category: "docs",
      icon: Play,
      badge: "Interactive",
    },
    {
      id: "markdown",
      title: "Markdown API Documentation",
      description: "Generate GitHub-flavored Markdown specification documentation (${slug}_api_docs.md)",
      category: "docs",
      icon: FileSpreadsheet,
    },
    {
      id: "sql_ddl",
      title: "SQL CREATE TABLE DDL",
      description: "Export schema as PostgreSQL and MySQL CREATE TABLE DDL scripts",
      category: "data",
      icon: Database,
    },
    {
      id: "data_export",
      title: "CSV / SQL / XML Data Exporter",
      description: "Export mock payload records to .csv, SQL INSERT statements, or .xml files",
      category: "data",
      icon: FileSpreadsheet,
    },
    {
      id: "sdk_code",
      title: "Multi-Language Client SDK & Snippets",
      description: "Generate client snippets in 8 languages (cURL, Fetch, Axios, Python, Go, Rust, Swift, Kotlin)",
      category: "code",
      icon: Code2,
      badge: "8 Languages",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-mb-surface border border-mb-border rounded-xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-mb-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-mb-text flex items-center gap-2">
              <Share2 className="w-5 h-5 text-mb-text" />
              Universal Export Hub
            </h2>
            <p className="text-2xs text-mb-text-tertiary mt-0.5">
              Export OpenAPI specs, Postman collections, HTML test benches, docs, or SDK code
            </p>
          </div>
          <button onClick={onClose} className="text-mb-text-tertiary hover:text-mb-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="p-5 overflow-y-auto space-y-3">
          {exportOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  onSelectExport(opt.id);
                  onClose();
                }}
                className="w-full flex items-start gap-3 p-3.5 rounded-lg border border-mb-border bg-mb-bg/40 hover:bg-mb-surface-hover hover:border-mb-border-hover text-left transition-colors group"
              >
                <div className="p-2 rounded-md bg-mb-surface border border-mb-border group-hover:border-mb-text-tertiary transition-colors shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-mb-text" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-mb-text">{opt.title}</span>
                    {opt.badge && (
                      <span className="text-3xs font-mono font-semibold px-1.5 py-0.5 rounded bg-mb-surface border border-mb-border text-mb-text-tertiary">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-3xs text-mb-text-tertiary mt-0.5 leading-snug">
                    {opt.description}
                  </p>
                </div>
                <Download className="w-4 h-4 text-mb-text-tertiary group-hover:text-mb-text transition-colors shrink-0 self-center" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
