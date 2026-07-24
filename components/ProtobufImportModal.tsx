"use client";

import { useState } from "react";
import { X, Upload, Code2, AlertCircle } from "lucide-react";
import { parseProtobufSchema } from "@/lib/exporters";
import { FieldDefinition } from "@/lib/mock-generator";

interface ProtobufImportModalProps {
  onClose: () => void;
  onImportSuccess: (data: {
    name: string;
    slug: string;
    fields: FieldDefinition[];
  }) => void;
}

export function ProtobufImportModal({ onClose, onImportSuccess }: ProtobufImportModalProps) {
  const [protoText, setProtoText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<boolean>(false);

  const processProto = (rawContent: string) => {
    try {
      setError(null);
      const parsed = parseProtobufSchema(rawContent);
      onImportSuccess(parsed);
      onClose();
    } catch (err: any) {
      setError(`Failed to parse Protobuf schema: ${err.message || "Invalid .proto syntax"}`);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        processProto(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-mb-surface border border-mb-border rounded-xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-mb-border pb-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-mb-text" />
            <h2 className="text-base font-semibold text-mb-text">Import Google Protocol Buffers (.proto)</h2>
          </div>
          <button onClick={onClose} className="text-mb-text-tertiary hover:text-mb-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-mb-text-secondary leading-relaxed">
          Drop any <code className="text-mb-text font-mono">*.proto</code> schema file or paste Protobuf <code className="text-mb-text font-mono">message</code> code blocks.
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
          <p className="text-xs font-medium text-mb-text">Drag & drop your .proto file here</p>
          <p className="text-2xs text-mb-text-tertiary mt-1">or click to browse local files</p>
          <input
            type="file"
            accept=".proto,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
            id="proto-file-input"
          />
          <label
            htmlFor="proto-file-input"
            className="mt-3 inline-flex mb-btn-secondary h-7 px-3 text-xs cursor-pointer"
          >
            Select File
          </label>
        </div>

        {/* Raw Proto Code Paste Textarea */}
        <div className="space-y-2">
          <label className="block text-2xs font-mono text-mb-text-tertiary uppercase">Or Paste Protobuf Code</label>
          <textarea
            value={protoText}
            onChange={(e) => setProtoText(e.target.value)}
            placeholder={`syntax = "proto3";\n\nmessage Customer {\n  string id = 1;\n  string full_name = 2;\n  string email = 3;\n  double account_balance = 4;\n  bool is_verified = 5;\n}`}
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
            onClick={() => processProto(protoText)}
            disabled={!protoText.trim()}
            className="mb-btn-primary h-8 px-4 text-xs disabled:opacity-50"
          >
            Import Protobuf
          </button>
        </div>
      </div>
    </div>
  );
}
