"use client";

import { useState } from "react";
import { X, Upload, Activity, AlertCircle } from "lucide-react";
import { parseHarArchive } from "@/lib/exporters";
import { FieldDefinition } from "@/lib/mock-generator";

interface HarImportModalProps {
  onClose: () => void;
  onImportSuccess: (data: {
    name: string;
    slug: string;
    method: string;
    fields: FieldDefinition[];
    sampleData?: any;
  }) => void;
}

export function HarImportModal({ onClose, onImportSuccess }: HarImportModalProps) {
  const [harEntries, setHarEntries] = useState<Array<{
    name: string;
    slug: string;
    method: string;
    fields: FieldDefinition[];
    sampleData?: any;
  }> | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<boolean>(false);

  const processJson = (rawContent: string) => {
    try {
      setError(null);
      const parsed = parseHarArchive(rawContent);
      if (parsed.length > 0) {
        setHarEntries(parsed);
        setSelectedIndex(0);
      } else {
        setError("No network recording entries found in HAR file.");
      }
    } catch (err: any) {
      setError(`Failed to parse HAR archive: ${err.message || "Invalid HAR JSON"}`);
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

  const handleConfirmImport = () => {
    if (harEntries && harEntries[selectedIndex]) {
      onImportSuccess(harEntries[selectedIndex]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-mb-surface border border-mb-border rounded-xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-mb-border pb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-mb-text" />
            <h2 className="text-base font-semibold text-mb-text">Import HAR Web Traffic Archive</h2>
          </div>
          <button onClick={onClose} className="text-mb-text-tertiary hover:text-mb-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-mb-text-secondary leading-relaxed">
          Drop any Chrome/Firefox DevTools <code className="text-mb-text font-mono">*.har</code> network recording file to convert recorded web traffic into mock endpoints.
        </p>

        {!harEntries ? (
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
            <p className="text-xs font-medium text-mb-text">Drag & drop your HAR network recording file here</p>
            <p className="text-2xs text-mb-text-tertiary mt-1">or click to browse local files</p>
            <input
              type="file"
              accept=".har,.json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
              id="har-file-input"
            />
            <label
              htmlFor="har-file-input"
              className="mt-3 inline-flex mb-btn-secondary h-7 px-3 text-xs cursor-pointer"
            >
              Select HAR File
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-2xs font-mono text-mb-text-tertiary uppercase">Select Recorded Endpoint to Import</label>
              <select
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(Number(e.target.value))}
                className="w-full bg-mb-bg border border-mb-border rounded-md p-2.5 text-xs text-mb-text focus:outline-none"
              >
                {harEntries.map((entry, idx) => (
                  <option key={idx} value={idx}>
                    {entry.method} /{entry.slug} ({entry.fields.length} fields)
                  </option>
                ))}
              </select>
            </div>

            {harEntries[selectedIndex] && (
              <div className="p-3 bg-mb-bg border border-mb-border rounded-md space-y-1 text-xs">
                <div className="font-semibold text-mb-text">{harEntries[selectedIndex].name}</div>
                <div className="text-2xs text-mb-text-tertiary font-mono">
                  Method: {harEntries[selectedIndex].method} | Inferred Fields: {harEntries[selectedIndex].fields.map(f => f.name).join(", ")}
                </div>
              </div>
            )}
          </div>
        )}

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
          {harEntries && (
            <button
              onClick={handleConfirmImport}
              className="mb-btn-primary h-8 px-4 text-xs"
            >
              Import Selected Traffic
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
