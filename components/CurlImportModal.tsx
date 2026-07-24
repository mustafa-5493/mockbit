"use client";

import { useState } from "react";
import { X, Terminal, Check, AlertCircle } from "lucide-react";
import { parseCurlCommand } from "@/lib/exporters";
import { FieldDefinition } from "@/lib/mock-generator";

interface CurlImportModalProps {
  onClose: () => void;
  onImportSuccess: (data: {
    name: string;
    slug: string;
    method: string;
    fields: FieldDefinition[];
    sampleData?: any;
  }) => void;
}

export function CurlImportModal({ onClose, onImportSuccess }: CurlImportModalProps) {
  const [curlText, setCurlText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    try {
      setError(null);
      if (!curlText.trim()) {
        setError("Please paste a valid cURL command string.");
        return;
      }
      const parsed = parseCurlCommand(curlText);
      onImportSuccess(parsed);
      onClose();
    } catch (err: any) {
      setError(`Failed to parse cURL command: ${err.message || "Invalid syntax"}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-mb-surface border border-mb-border rounded-xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-mb-border pb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-mb-text" />
            <h2 className="text-base font-semibold text-mb-text">Import cURL Command</h2>
          </div>
          <button onClick={onClose} className="text-mb-text-tertiary hover:text-mb-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-mb-text-secondary leading-relaxed">
          Paste any terminal <code className="text-mb-text font-mono">curl</code> command string to auto-extract the URL slug, HTTP method, and mock fields.
        </p>

        <div className="space-y-2">
          <label className="block text-2xs font-mono text-mb-text-tertiary uppercase">Paste cURL Command</label>
          <textarea
            value={curlText}
            onChange={(e) => setCurlText(e.target.value)}
            placeholder={`curl -X POST "https://api.stripe.com/v1/invoices" -H "Content-Type: application/json" -d '{"customer": "cus_99", "amount": 14900}'`}
            rows={6}
            className="w-full bg-mb-bg border border-mb-border rounded-md p-3 text-xs font-mono text-mb-text focus:outline-none leading-relaxed"
          />
        </div>

        {error && (
          <div className="p-3 bg-mb-surface border border-mb-border rounded-md flex items-center gap-2 text-xs text-mb-text font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-mb-text-tertiary" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-mb-border pt-4">
          <button onClick={onClose} className="mb-btn-secondary h-8 px-3 text-xs">
            Cancel
          </button>
          <button
            onClick={handleParse}
            disabled={!curlText.trim()}
            className="mb-btn-primary h-8 px-4 text-xs disabled:opacity-50"
          >
            Parse cURL & Import
          </button>
        </div>
      </div>
    </div>
  );
}
