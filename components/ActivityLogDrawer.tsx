"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTransactionLogs, rewindToVersion } from "@/lib/store-engine";
import { TransactionLogEntry } from "@/lib/mock-generator";
import {
  Activity,
  X,
  Play,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  GitCommit,
} from "lucide-react";

export interface LogEntry {
  id: string;
  method: string;
  url: string;
  statusCode: number;
  executionMs: number;
  timestamp: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  response?: any;
}

interface ActivityLogDrawerProps {
  endpoint: any;
  onClose: () => void;
}

export function ActivityLogDrawer({ endpoint, onClose }: ActivityLogDrawerProps) {
  const router = useRouter();

  const [txHistory, setTxHistory] = useState<TransactionLogEntry[]>(
    getTransactionLogs("demo", endpoint.slug)
  );

  const getInitialLogs = (): LogEntry[] => {
    const now = new Date();
    return [
      {
        id: "log-1",
        method: "POST",
        url: `/api/v1/demo/${endpoint.slug}`,
        statusCode: 201,
        executionMs: 142,
        timestamp: new Date(now.getTime() - 120000).toLocaleTimeString(),
        headers: { authorization: "Bearer demo_token_982", "content-type": "application/json" },
        query: {},
        body: { customer_name: "Sarah Connor", email: "sarah@cyberdyne.com", total: 149.99 },
        response: { id: "ord_9824a", status: "created", created_at: now.toISOString() },
      },
      {
        id: "log-2",
        method: "GET",
        url: `/api/v1/demo/${endpoint.slug}?page=2`,
        statusCode: 200,
        executionMs: 45,
        timestamp: new Date(now.getTime() - 360000).toLocaleTimeString(),
        headers: { accept: "application/json" },
        query: { page: "2" },
        body: null,
        response: [
          { id: "1", customer: "Alex Rivera", total: "$299.50" },
          { id: "2", customer: "John Doe", total: "$45.00" },
        ],
      },
    ];
  };

  const [logs] = useState<LogEntry[]>(getInitialLogs());
  const [expandedId, setExpandedId] = useState<string | null>("log-1");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleRewind = (version: number) => {
    const res = rewindToVersion("demo", endpoint.slug, "main", version);
    if (res) {
      setTxHistory([...getTransactionLogs("demo", endpoint.slug, "main")]);
      alert(`Store state successfully rewound to version v${version}`);
    } else {
      alert(`Failed to rewind to version v${version}`);
    }
  };

  const handleOpenInSimulator = (log: LogEntry) => {
    const params = new URLSearchParams();
    params.set("simMethod", log.method);
    if (log.headers?.authorization) {
      params.set("simHeaderKey", "authorization");
      params.set("simHeaderVal", log.headers.authorization);
    }
    if (log.query && Object.keys(log.query).length > 0) {
      const firstKey = Object.keys(log.query)[0];
      params.set("simQueryKey", firstKey);
      params.set("simQueryVal", log.query[firstKey]);
    }
    if (log.body) {
      params.set("simBody", JSON.stringify(log.body, null, 2));
    }
    router.push(`/dashboard/endpoints/new?${params.toString()}`);
  };

  const handleCopyCurl = (log: LogEntry) => {
    let curl = `curl -X ${log.method} "http://localhost:3000${log.url}"`;
    if (log.headers) {
      Object.entries(log.headers).forEach(([k, v]) => {
        curl += ` \\\n  -H "${k}: ${v}"`;
      });
    }
    if (log.body) {
      curl += ` \\\n  -d '${JSON.stringify(log.body)}'`;
    }
    navigator.clipboard.writeText(curl);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-mb-bg border-l border-mb-border w-full max-w-2xl h-full flex flex-col shadow-mb-md">
        {/* Drawer Header */}
        <div className="p-5 border-b border-mb-border flex items-center justify-between bg-mb-surface">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-mb-bg-raised border border-mb-border flex items-center justify-center">
              <Activity className="w-4 h-4 text-mb-text" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-mb-text tracking-tight flex items-center gap-2">
                <span>{endpoint.name} Activity & State Ledger</span>
              </h2>
              <p className="text-2xs text-mb-text-tertiary font-mono">/api/v1/demo/{endpoint.slug}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-mb-surface-hover text-mb-text-tertiary hover:text-mb-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transaction Rewind Ledger */}
        <div className="p-4 border-b border-mb-border bg-mb-bg-raised space-y-3">
          <h3 className="text-2xs font-semibold text-mb-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
            <GitCommit className="w-3.5 h-3.5 text-mb-text-tertiary" />
            <span>Time-Travel State Ledger (Immutable Mutations)</span>
          </h3>

          <div className="divide-y divide-mb-border border border-mb-border rounded-md bg-mb-surface overflow-hidden">
            {txHistory.map((tx) => (
              <div key={tx.version} className="p-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="font-mono text-2xs text-mb-text-disabled font-bold">v{tx.version}</span>
                  <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-mb-bg-raised text-mb-text-secondary border border-mb-border">
                    {tx.method}
                  </span>
                  <span className="font-mono text-2xs text-mb-text-secondary truncate">{tx.diff}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-2xs text-mb-text-tertiary font-mono">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => handleRewind(tx.version)}
                    className="mb-btn-secondary inline-flex h-6 items-center px-2 text-2xs"
                    title={`Roll back store state to v${tx.version}`}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    <span>Rewind to v{tx.version}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HTTP Traffic Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <h3 className="text-2xs font-semibold text-mb-text-tertiary uppercase tracking-wider">
            HTTP Traffic Logs
          </h3>
          {logs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div key={log.id} className="mb-panel overflow-hidden">
                <div
                  onClick={() => toggleExpand(log.id)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-mb-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-mb-text-tertiary" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-mb-text-tertiary" />
                    )}
                    <span className="font-mono text-xs text-mb-text-secondary font-bold">{log.method}</span>
                    <span className="font-mono text-xs text-mb-text truncate max-w-xs">{log.url}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-mb-bg-raised text-mb-text-secondary border border-mb-border text-2xs font-mono">
                      HTTP {log.statusCode}
                    </span>
                    <span className="text-2xs font-mono text-mb-text-tertiary">{log.executionMs}ms</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-mb-border bg-mb-bg-raised space-y-4 text-xs">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleCopyCurl(log)}
                        className="mb-btn-secondary inline-flex h-7 items-center px-2.5 text-2xs"
                      >
                        {copiedId === log.id ? <Check className="w-3 h-3 text-mb-success mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                        <span>{copiedId === log.id ? "Copied" : "Copy cURL"}</span>
                      </button>

                      <button
                        onClick={() => handleOpenInSimulator(log)}
                        className="mb-btn-primary inline-flex h-7 items-center px-2.5 text-2xs"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        <span>Open in Simulator</span>
                      </button>
                    </div>

                    {log.body && (
                      <div>
                        <span className="text-2xs text-mb-text-tertiary font-mono block mb-1">Request Body</span>
                        <pre className="p-3 bg-mb-surface border border-mb-border rounded text-2xs font-mono text-mb-text-secondary overflow-x-auto">
                          {JSON.stringify(log.body, null, 2)}
                        </pre>
                      </div>
                    )}

                    {log.response && (
                      <div>
                        <span className="text-2xs text-mb-text-tertiary font-mono block mb-1">Response Output</span>
                        <pre className="p-3 bg-mb-surface border border-mb-border rounded text-2xs font-mono text-mb-text-secondary overflow-x-auto">
                          {JSON.stringify(log.response, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
