"use client";

import { useState } from "react";
import { X, Globe, Radio, Sparkles, Loader2, Check } from "lucide-react";
import { FieldDefinition } from "@/lib/mock-generator";

interface ProxyRecorderModalProps {
  onClose: () => void;
  onImportSuccess: (data: {
    name: string;
    slug: string;
    fields: FieldDefinition[];
    responseType: "object" | "array";
    arrayLength: number;
    sampleData: any;
  }) => void;
}

export function ProxyRecorderModal({ onClose, onImportSuccess }: ProxyRecorderModalProps) {
  const [targetUrl, setTargetUrl] = useState<string>("https://jsonplaceholder.typicode.com/posts/1");
  const [httpMethod, setHttpMethod] = useState<string>("GET");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recordedResult, setRecordedResult] = useState<any | null>(null);

  const handleRecordProxyTraffic = async () => {
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      setErrorMsg("Target URL must start with http:// or https://");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/proxy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetUrl, method: httpMethod }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Proxy failed with status ${res.status}`);
      }

      const data = await res.json();
      setRecordedResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect to target URL");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecordedSchema = () => {
    if (!recordedResult) return;

    // Derive name and slug from URL
    try {
      const urlObj = new URL(recordedResult.targetUrl);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      const rawName = pathParts[pathParts.length - 1] || "recorded_api";
      const cleanSlug = rawName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");

      onImportSuccess({
        name: rawName.charAt(0).toUpperCase() + rawName.slice(1),
        slug: cleanSlug,
        fields: recordedResult.inferredFields,
        responseType: recordedResult.responseType,
        arrayLength: recordedResult.arrayLength,
        sampleData: recordedResult.responseBody,
      });

      onClose();
    } catch {
      onImportSuccess({
        name: "Recorded API",
        slug: "recorded_api",
        fields: recordedResult.inferredFields,
        responseType: recordedResult.responseType,
        arrayLength: recordedResult.arrayLength,
        sampleData: recordedResult.responseBody,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-mb-surface border border-mb-border rounded-xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-mb-border pb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-mb-text animate-pulse" />
            <h2 className="text-base font-semibold text-mb-text">Proxy & Live Traffic Recorder</h2>
          </div>
          <button onClick={onClose} className="text-mb-text-tertiary hover:text-mb-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-mb-text-secondary leading-relaxed">
          Forward an HTTP request to any live backend API (e.g. Stripe, GitHub, JSONPlaceholder), record response traffic, and automatically build a stateful Mockbit mock endpoint.
        </p>

        {errorMsg && (
          <div className="p-3 bg-mb-surface border border-mb-border text-xs text-mb-text rounded-md font-mono">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <select
              value={httpMethod}
              onChange={(e) => setHttpMethod(e.target.value)}
              className="mb-input w-24 h-9 font-mono text-xs text-mb-text bg-mb-bg border border-mb-border rounded"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>

            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://api.example.com/v1/users"
              className="mb-input flex-1 h-9 px-3 font-mono text-xs text-mb-text bg-mb-bg border border-mb-border rounded"
            />

            <button
              onClick={handleRecordProxyTraffic}
              disabled={loading}
              className="mb-btn-primary h-9 px-4 text-xs flex items-center gap-1.5 whitespace-nowrap"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              <span>{loading ? "Proxying..." : "Record Traffic"}</span>
            </button>
          </div>

          {recordedResult && (
            <div className="space-y-3 pt-4 border-t border-mb-border font-mono text-xs">
              <div className="flex items-center justify-between text-2xs text-mb-text-tertiary">
                <span>Status: <strong className="text-mb-success">{recordedResult.statusCode} OK</strong></span>
                <span>Type: <strong>{recordedResult.responseType}</strong> ({recordedResult.inferredFields.length} fields)</span>
              </div>

              <div className="space-y-1">
                <span className="text-2xs text-mb-text-tertiary">Inferred Field Schema:</span>
                <div className="flex flex-wrap gap-1 p-2 rounded bg-mb-bg border border-mb-border">
                  {recordedResult.inferredFields.map((f: FieldDefinition) => (
                    <span key={f.name} className="px-2 py-0.5 rounded bg-mb-surface border border-mb-border text-[10px] text-mb-text">
                      {f.name}: <span className="text-mb-text-tertiary">{f.type}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-2xs text-mb-text-tertiary">Recorded Sample Payload:</span>
                <pre className="p-3 bg-mb-bg border border-mb-border rounded font-mono text-[11px] text-mb-key max-h-36 overflow-y-auto">
                  <code>{JSON.stringify(recordedResult.responseBody, null, 2)}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-mb-border">
          <button onClick={onClose} className="mb-btn-secondary h-9 px-4 text-xs">
            Cancel
          </button>
          <button
            onClick={handleApplyRecordedSchema}
            disabled={!recordedResult}
            className="mb-btn-primary h-9 px-4 text-xs flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply Recorded Traffic to Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
