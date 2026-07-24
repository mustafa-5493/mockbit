"use client";

import { useState } from "react";
import { X, Upload, FileCode, AlertCircle } from "lucide-react";
import { parseInsomniaCollection } from "@/lib/exporters";
import { FieldDefinition } from "@/lib/mock-generator";

interface InsomniaImportModalProps {
  onClose: () => void;
  onImportSuccess: (data: {
    name: string;
    slug: string;
    method: string;
    fields: FieldDefinition[];
    sampleData?: any;
  }) => void;
}

export function InsomniaImportModal({ onClose, onImportSuccess }: InsomniaImportModalProps) {
  const [jsonText, setJsonText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<boolean>(false);

  const processJson = (rawContent: string) => {
    try {
      setError(null);
      const parsed = parseInsomniaCollection(rawContent);
      onImportSuccess(parsed);
      onClose();
    } catch (err: any) {
      setError(`Failed to parse Insomnia collection: ${err.message || "Invalid Insomnia workspace JSON"}`);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        processJson(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-mb-surface border border-mb-border rounded-xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-mb-border pb-4">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-mb-text" />
            <h2 className="text-base font-semibold text-mb-text">Import Insomnia / Bruno Workspace</h2>
          </div>
          <button onClick={onClose} className="text-mb-text-tertiary hover:text-mb-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-mb-text-secondary leading-relaxed">
          Drop any Insomnia export <code className="text-mb-text font-mono">*.json</code> file or paste workspace JSON to auto-populate endpoint fields.
        </p>

        {/* Drag & Drop File Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFileUpload(file);
          }}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragging ? "border-mb-text bg-mb-surface-active" : "border-mb-border bg-mb-bg hover:border-mb-border-hover"
          }`}
        >
          <Upload className="w-8 h-8 text-mb-text-tertiary mx-auto mb-2" />
          <p className="text-xs font-medium text-mb-text">Drag & drop your Insomnia / Bruno workspace file here</p>
          <p className="text-2xs text-mb-text-tertiary mt-1">or click to browse local files</p>
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
            id="insomnia-file-input"
          />
          <label
            htmlFor="insomnia-file-input"
            className="mt-3 inline-flex mb-btn-secondary h-7 px-3 text-xs cursor-pointer"
          >
            Select File
          </label>
        </div>

        {/* Raw JSON Paste Textarea */}
        <div className="space-y-2">
          <label className="block text-2xs font-mono text-mb-text-tertiary uppercase">Or Paste Workspace JSON</label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='{ "_type": "export", "__export_format": 4, "resources": [...] }'
            rows={5}
            className="w-full bg-mb-bg border border-mb-border rounded-md p-3 text-xs font-mono text-mb-text focus:outline-none"
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
            onClick={() => processJson(jsonText)}
            disabled={!jsonText.trim()}
            className="mb-btn-primary h-8 px-4 text-xs disabled:opacity-50"
          >
            Import Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
