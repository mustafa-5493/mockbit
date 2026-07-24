"use client";

import { useState } from "react";
import { X, Sparkles, Database, Check, ArrowRight, Loader2 } from "lucide-react";
import { FieldDefinition } from "@/lib/mock-generator";

interface MockApiImportModalProps {
  onClose: () => void;
  onImportSuccess: (importedData: {
    name: string;
    slug: string;
    fields: FieldDefinition[];
    responseType: "object" | "array";
    arrayLength: number;
    sampleData: any[];
  }) => void;
}

export function MockApiImportModal({ onClose, onImportSuccess }: MockApiImportModalProps) {
  const [mockapiUrl, setMockapiUrl] = useState<string>("https://65ab123.mockapi.io/api/v1/users");
  const [jsonInput, setJsonInput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"url" | "json">("url");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inferFieldsFromSample = (sampleObj: Record<string, any>): FieldDefinition[] => {
    const fields: FieldDefinition[] = [];
    Object.entries(sampleObj).forEach(([key, value]) => {
      let type: FieldDefinition["type"] = "lorem";

      if (key === "id" || key === "_id") type = "uuid";
      else if (key.toLowerCase().includes("name")) type = "fullName";
      else if (key.toLowerCase().includes("email")) type = "email";
      else if (key.toLowerCase().includes("avatar") || key.toLowerCase().includes("image")) type = "avatar";
      else if (key.toLowerCase().includes("phone")) type = "phone";
      else if (key.toLowerCase().includes("date") || key.toLowerCase().includes("createdat")) type = "date";
      else if (typeof value === "number") type = "number";
      else if (typeof value === "boolean") type = "boolean";
      else if (typeof value === "object") type = "object";

      fields.push({ name: key, type });
    });
    return fields;
  };

  const handleImportUrl = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const cleanUrl = mockapiUrl.trim();
      if (!cleanUrl.startsWith("http")) {
        throw new Error("Please enter a valid HTTP/HTTPS URL from MockAPI");
      }

      const res = await fetch(cleanUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch from MockAPI (Status: ${res.status})`);
      }

      const data = await res.json();
      const records = Array.isArray(data) ? data : [data];
      if (records.length === 0) {
        throw new Error("MockAPI endpoint returned an empty array");
      }

      const sample = records[0];
      const fields = inferFieldsFromSample(sample);
      const urlParts = cleanUrl.split("/").filter(Boolean);
      const resourceName = urlParts[urlParts.length - 1] || "imported_resource";

      onImportSuccess({
        name: resourceName.charAt(0).toUpperCase() + resourceName.slice(1),
        slug: resourceName.toLowerCase(),
        fields,
        responseType: "array",
        arrayLength: records.length,
        sampleData: records,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to import from MockAPI URL");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportJson = () => {
    setErrorMsg(null);
    try {
      const parsed = JSON.parse(jsonInput);
      const records = Array.isArray(parsed) ? parsed : [parsed];
      if (records.length === 0) {
        throw new Error("JSON payload must contain at least 1 object");
      }

      const sample = records[0];
      const fields = inferFieldsFromSample(sample);

      onImportSuccess({
        name: "Imported Custom Resource",
        slug: "custom_resource",
        fields,
        responseType: Array.isArray(parsed) ? "array" : "object",
        arrayLength: records.length,
        sampleData: records,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid JSON payload provided");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-mb-surface border border-mb-border rounded-xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-mb-border pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-mb-text" />
            <h2 className="text-base font-semibold text-mb-text">1-Click MockAPI & JSON Importer</h2>
          </div>
          <button onClick={onClose} className="text-mb-text-tertiary hover:text-mb-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-mb-text-secondary">
          Migrate your existing endpoints from <code className="text-mb-text font-mono font-bold">mockapi.io</code> or raw JSON into Mockbit in under 3 seconds with stateful mutations & $0/mo cost.
        </p>

        {/* Tab Switcher */}
        <div className="flex border-b border-mb-border text-xs font-mono">
          <button
            onClick={() => setActiveTab("url")}
            className={`pb-2 px-3 border-b-2 font-medium transition-colors ${
              activeTab === "url" ? "border-mb-text text-mb-text" : "border-transparent text-mb-text-tertiary"
            }`}
          >
            Import via MockAPI URL
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`pb-2 px-3 border-b-2 font-medium transition-colors ${
              activeTab === "json" ? "border-mb-text text-mb-text" : "border-transparent text-mb-text-tertiary"
            }`}
          >
            Paste Raw JSON
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-mb-surface border border-mb-border text-xs text-mb-text rounded-md font-mono">
            {errorMsg}
          </div>
        )}

        {activeTab === "url" ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-2xs font-mono text-mb-text-tertiary">MockAPI Endpoint URL:</label>
              <input
                type="text"
                value={mockapiUrl}
                onChange={(e) => setMockapiUrl(e.target.value)}
                placeholder="https://65ab123.mockapi.io/api/v1/users"
                className="w-full bg-mb-bg-raised border border-mb-border rounded-md px-3 py-2 text-xs font-mono text-mb-text focus:outline-none"
              />
            </div>
            <button
              onClick={handleImportUrl}
              disabled={isLoading}
              className="mb-btn-primary w-full h-9 text-xs flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isLoading ? "Fetching & Introspecting..." : "Import MockAPI Endpoint"}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-2xs font-mono text-mb-text-tertiary">Paste JSON Data:</label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={5}
                placeholder={`[\n  { "id": "1", "name": "John Doe", "email": "john@example.com" }\n]`}
                className="w-full bg-mb-bg-raised border border-mb-border rounded-md p-3 font-mono text-xs text-mb-text focus:outline-none"
              />
            </div>
            <button onClick={handleImportJson} className="mb-btn-primary w-full h-9 text-xs flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              <span>Import JSON Schema</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
