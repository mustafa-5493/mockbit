"use client";

import { useState } from "react";
import { X, Upload, FileCode2, AlertCircle } from "lucide-react";
import { parseTypeScriptType } from "@/lib/exporters";
import { FieldDefinition } from "@/lib/mock-generator";

interface TypeScriptImportModalProps {
  onClose: () => void;
  onImportSuccess: (data: {
    name: string;
    slug: string;
    fields: FieldDefinition[];
  }) => void;
}

export function TypeScriptImportModal({ onClose, onImportSuccess }: TypeScriptImportModalProps) {
  const [tsText, setTsText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<boolean>(false);

  const processTs = (rawContent: string) => {
    try {
      setError(null);
      const parsed = parseTypeScriptType(rawContent);
      onImportSuccess(parsed);
      onClose();
    } catch (err: any) {
      setError(`Failed to parse TypeScript definition: ${err.message || "Invalid interface/type syntax"}`);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        processTs(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-mb-surface border border-mb-border rounded-xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-mb-border pb-4">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-mb-text" />
            <h2 className="text-base font-semibold text-mb-text">Import TypeScript Interface / Type</h2>
          </div>
          <button onClick={onClose} className="text-mb-text-tertiary hover:text-mb-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-mb-text-secondary leading-relaxed">
          Drop any <code className="text-mb-text font-mono">*.ts</code> / <code className="text-mb-text font-mono">*.tsx</code> type file or paste TypeScript <code className="text-mb-text font-mono">interface</code> code blocks.
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
          <p className="text-xs font-medium text-mb-text">Drag & drop your TypeScript file here</p>
          <p className="text-2xs text-mb-text-tertiary mt-1">or click to browse local files</p>
          <input
            type="file"
            accept=".ts,.tsx,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
            id="ts-file-input"
          />
          <label
            htmlFor="ts-file-input"
            className="mt-3 inline-flex mb-btn-secondary h-7 px-3 text-xs cursor-pointer"
          >
            Select File
          </label>
        </div>

        {/* Raw TS Code Paste Textarea */}
        <div className="space-y-2">
          <label className="block text-2xs font-mono text-mb-text-tertiary uppercase">Or Paste TypeScript Code</label>
          <textarea
            value={tsText}
            onChange={(e) => setTsText(e.target.value)}
            placeholder={`interface UserProfile {\n  id: string;\n  email: string;\n  role: 'admin' | 'member';\n  balance: number;\n  is_verified: boolean;\n}`}
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
            onClick={() => processTs(tsText)}
            disabled={!tsText.trim()}
            className="mb-btn-primary h-8 px-4 text-xs disabled:opacity-50"
          >
            Import TS Type
          </button>
        </div>
      </div>
    </div>
  );
}
