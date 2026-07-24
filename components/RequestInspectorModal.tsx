"use client";

import { useState, useEffect } from "react";
import { X, Activity, RefreshCw, Trash2, Copy, Check, Filter, Clock, Terminal, ArrowRight, Share2 } from "lucide-react";
import { LoggedRequest } from "@/lib/store-engine";
import { ActiveInspectorsBadge } from "@/components/ActiveInspectorsBadge";

interface RequestInspectorModalProps {
  onClose: () => void;
  slugFilter?: string;
}

export function RequestInspectorModal({ onClose, slugFilter }: RequestInspectorModalProps) {
  const [logs, setLogs] = useState<LoggedRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<LoggedRequest | null>(null);
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const fetchLogs = async () => {
    try {
      const url = slugFilter ? `/api/v1/logs?slug=${slugFilter}` : `/api/v1/logs`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (!selectedLog && data.logs && data.logs.length > 0) {
          setSelectedLog(data.logs[0]);
        }
      }
    } catch {
      // Ignore network errors during background polling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh, slugFilter]);

  const handleClearLogs = async () => {
    try {
      await fetch("/api/v1/logs", { method: "DELETE" });
      setLogs([]);
      setSelectedLog(null);
    } catch {
      // Ignore error
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (methodFilter === "ALL") return true;
    return log.method.toUpperCase() === methodFilter;
  });

  const handleShareLog = (log: LoggedRequest) => {
    try {
      const payload = {
        id: log.id,
        method: log.method,
        path: log.path,
        status: log.response_status,
        headers: log.headers,
        requestBody: log.body,
        responseBody: log.response_body,
        timestamp: log.timestamp,
        latency: log.latency_ms,
      };

      const encoded = encodeURIComponent(btoa(JSON.stringify(payload)));
      const shareUrl = `${window.location.origin}/dashboard/endpoints/new?shareLog=${encoded}`;

      navigator.clipboard.writeText(shareUrl);
      setCopiedKey(`share_${log.id}`);
      setTimeout(() => setCopiedKey(null), 3000);
    } catch (err) {
      // fallback
    }
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET": return "bg-mb-bg-raised text-mb-text border-mb-border";
      case "POST": return "bg-mb-surface-active text-mb-text font-bold border-mb-border";
      case "PUT":
      case "PATCH": return "bg-mb-surface text-mb-text border-mb-border";
      case "DELETE": return "bg-mb-bg text-mb-text-secondary border-mb-border";
      default: return "bg-mb-surface text-mb-text-tertiary border-mb-border";
    }
  };

  const getStatusBadgeClass = (status: number) => {
    if (status >= 200 && status < 300) return "text-mb-success font-bold";
    if (status >= 400 && status < 500) return "text-mb-text-secondary font-bold";
    return "text-mb-text-tertiary font-bold";
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
      <div className="bg-mb-surface border-l border-mb-border max-w-4xl w-full h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 h-14 border-b border-mb-border flex items-center justify-between bg-mb-surface">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-mb-text animate-pulse" />
            <h2 className="text-sm font-semibold text-mb-text font-mono">
              Live HTTP Request Inspector & Webhook Debugger
            </h2>
            <span className="text-2xs font-mono px-2 py-0.5 rounded bg-mb-bg text-mb-text-tertiary border border-mb-border">
              {filteredLogs.length} Requests Captured
            </span>
            <ActiveInspectorsBadge endpointSlug={slugFilter} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`mb-btn-secondary h-8 px-2.5 text-xs flex items-center gap-1.5 font-mono ${
                autoRefresh ? "border-mb-border text-mb-text" : "text-mb-text-tertiary"
              }`}
              title="Toggle auto-refresh polling every 2s"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? "animate-spin text-mb-text" : ""}`} />
              <span>{autoRefresh ? "Live (2s)" : "Paused"}</span>
            </button>

            <button
              onClick={handleClearLogs}
              className="mb-btn-secondary h-8 px-2.5 text-xs flex items-center gap-1 text-mb-text-tertiary hover:text-mb-text"
              title="Clear captured request logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button onClick={onClose} className="text-mb-text-tertiary hover:text-mb-text p-1 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="px-6 py-2 border-b border-mb-border bg-mb-bg flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-mb-text-tertiary" />
            <span className="text-mb-text-tertiary text-2xs uppercase">Method:</span>
            {["ALL", "GET", "POST", "PUT", "DELETE"].map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors border ${
                  methodFilter === m
                    ? "bg-mb-surface text-mb-text border-mb-border font-bold"
                    : "bg-transparent text-mb-text-tertiary border-transparent hover:text-mb-text"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {slugFilter && (
            <span className="text-2xs text-mb-text-tertiary">
              Filtering by slug: <strong className="text-mb-text font-mono">/{slugFilter}</strong>
            </span>
          )}
        </div>

        {/* Content Split Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Log Stream Sidebar */}
          <div className="w-80 border-r border-mb-border bg-mb-bg overflow-y-auto divide-y divide-mb-border">
            {loading ? (
              <div className="p-8 text-center text-xs text-mb-text-tertiary font-mono">
                Loading request logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Clock className="w-8 h-8 text-mb-text-tertiary mx-auto" />
                <p className="text-xs text-mb-text-secondary font-mono">No requests logged yet.</p>
                <p className="text-2xs text-mb-text-tertiary">Trigger any API request to see traffic live.</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-3 cursor-pointer transition-colors space-y-1.5 ${
                    selectedLog?.id === log.id
                      ? "bg-mb-surface border-l-2 border-mb-text shadow-sm"
                      : "hover:bg-mb-surface-active"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${getMethodBadgeClass(log.method)}`}>
                      {log.method}
                    </span>
                    <span className={`text-[11px] font-mono ${getStatusBadgeClass(log.response_status)}`}>
                      {log.response_status}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-mb-text truncate" title={log.path}>
                    {log.path}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-mb-text-tertiary">
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span>{log.latency_ms}ms</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Log Inspector Detail View */}
          <div className="flex-1 bg-mb-bg-raised overflow-y-auto p-6 space-y-6">
            {selectedLog ? (
              <>
                {/* Request Overview */}
                <div className="space-y-3 border-b border-mb-border pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono">
                      <span className={`px-2 py-0.5 rounded text-xs border ${getMethodBadgeClass(selectedLog.method)}`}>
                        {selectedLog.method}
                      </span>
                      <span className="text-sm font-semibold text-mb-text truncate">{selectedLog.path}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-mono ${getStatusBadgeClass(selectedLog.response_status)}`}>
                        {selectedLog.response_status}
                      </span>
                      <button
                        onClick={() => handleShareLog(selectedLog)}
                        className="mb-btn-secondary h-7 px-2 text-2xs inline-flex items-center gap-1 font-mono"
                        title="Copy 1-Click Permanent Shareable Request Snapshot URL"
                      >
                        {copiedKey === `share_${selectedLog.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-mb-text" />
                            <span>Copied Link!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3 h-3 text-mb-text-tertiary" />
                            <span>Share Snapshot</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-2xs font-mono text-mb-text-tertiary">
                    <span>Time: <strong className="text-mb-text">{new Date(selectedLog.timestamp).toISOString()}</strong></span>
                    <span>Latency: <strong className="text-mb-text">{selectedLog.latency_ms}ms</strong></span>
                    <span>IP: <strong className="text-mb-text">{selectedLog.ip || "127.0.0.1"}</strong></span>
                  </div>
                </div>

                {/* HTTP Headers */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-mono text-mb-text-tertiary uppercase tracking-wider">HTTP Request Headers</span>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(selectedLog.headers, null, 2), "headers")}
                      className="text-[10px] font-mono text-mb-text-tertiary hover:text-mb-text flex items-center gap-1"
                    >
                      {copiedKey === "headers" ? <Check className="w-3 h-3 text-mb-success" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === "headers" ? "Copied" : "Copy Headers"}</span>
                    </button>
                  </div>

                  <div className="p-3 bg-mb-surface border border-mb-border rounded-md font-mono text-xs space-y-1 max-h-40 overflow-y-auto">
                    {Object.entries(selectedLog.headers || {}).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-mb-text-tertiary">{k}:</span>
                        <span className="text-mb-text break-all">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Request Body Payload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-mono text-mb-text-tertiary uppercase tracking-wider">Request Payload (Body)</span>
                    {selectedLog.body && (
                      <button
                        onClick={() => copyToClipboard(typeof selectedLog.body === "string" ? selectedLog.body : JSON.stringify(selectedLog.body, null, 2), "req_body")}
                        className="text-[10px] font-mono text-mb-text-tertiary hover:text-mb-text flex items-center gap-1"
                      >
                        {copiedKey === "req_body" ? <Check className="w-3 h-3 text-mb-success" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === "req_body" ? "Copied" : "Copy Payload"}</span>
                      </button>
                    )}
                  </div>

                  <pre className="p-4 bg-mb-surface border border-mb-border rounded-md font-mono text-xs text-mb-key max-h-48 overflow-y-auto leading-relaxed">
                    <code>
                      {selectedLog.body
                        ? typeof selectedLog.body === "string"
                          ? selectedLog.body
                          : JSON.stringify(selectedLog.body, null, 2)
                        : "// (No request body payload)"}
                    </code>
                  </pre>
                </div>

                {/* Response Output JSON */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-mono text-mb-text-tertiary uppercase tracking-wider">Response Output JSON</span>
                    {selectedLog.response_body && (
                      <button
                        onClick={() => copyToClipboard(typeof selectedLog.response_body === "string" ? selectedLog.response_body : JSON.stringify(selectedLog.response_body, null, 2), "res_body")}
                        className="text-[10px] font-mono text-mb-text-tertiary hover:text-mb-text flex items-center gap-1"
                      >
                        {copiedKey === "res_body" ? <Check className="w-3 h-3 text-mb-success" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === "res_body" ? "Copied" : "Copy Response"}</span>
                      </button>
                    )}
                  </div>

                  <pre className="p-4 bg-mb-surface border border-mb-border rounded-md font-mono text-xs text-mb-key max-h-56 overflow-y-auto leading-relaxed">
                    <code>
                      {selectedLog.response_body
                        ? typeof selectedLog.response_body === "string"
                          ? selectedLog.response_body
                          : JSON.stringify(selectedLog.response_body, null, 2)
                        : "// (Empty response body)"}
                    </code>
                  </pre>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-8">
                <div className="space-y-2">
                  <Terminal className="w-10 h-10 text-mb-text-tertiary mx-auto" />
                  <p className="text-xs text-mb-text-secondary font-mono">Select a request from the left sidebar to inspect details.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
