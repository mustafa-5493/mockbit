"use client";

import { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, Check, Sparkles } from "lucide-react";
import { FieldDefinition } from "@/lib/mock-generator";

interface CsvSchemaImportModalProps {
  onClose: () => void;
  onImportSuccess: (importedData: {
    name: string;
    slug: string;
    fields: FieldDefinition[];
    records: Record<string, any>[];
  }) => void;
}

export function CsvSchemaImportModal({ onClose, onImportSuccess }: CsvSchemaImportModalProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvRawText, setCsvRawText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCsvText = (text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && (i === 0 || line[i - 1] !== "\\")) {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
      return result;
    };

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(parseLine);
    return { headers, rows };
  };

  const inferFieldType = (header: string, sampleValues: string[]): FieldDefinition["type"] => {
    const lowerHeader = header.toLowerCase();

    if (lowerHeader === "id" || lowerHeader === "_id" || lowerHeader.includes("uuid")) return "uuid";
    if (lowerHeader.includes("first_name") || lowerHeader.includes("firstname")) return "firstName";
    if (lowerHeader.includes("last_name") || lowerHeader.includes("lastname")) return "lastName";
    if (lowerHeader.includes("name")) return "fullName";
    if (lowerHeader.includes("email")) return "email";
    if (lowerHeader.includes("avatar") || lowerHeader.includes("image") || lowerHeader.includes("picture")) return "avatar";
    if (lowerHeader.includes("phone")) return "phone";
    if (lowerHeader.includes("city")) return "city";
    if (lowerHeader.includes("country")) return "country";
    if (lowerHeader.includes("address")) return "address";
    if (lowerHeader.includes("company")) return "company";
    if (lowerHeader.includes("price") || lowerHeader.includes("amount") || lowerHeader.includes("cost") || lowerHeader.includes("total")) return "currency";
    if (lowerHeader.includes("date") || lowerHeader.includes("created")) return "date";
    if (lowerHeader.includes("url") || lowerHeader.includes("website")) return "url";

    // Inspect sample values
    const nonNullValues = sampleValues.filter((v) => v !== "" && v !== undefined);
    if (nonNullValues.every((v) => v === "true" || v === "false" || v === "0" || v === "1")) return "boolean";
    if (nonNullValues.every((v) => !isNaN(Number(v)))) return "number";

    return "lorem";
  };

  const handleFileChange = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setErrorMsg("Please upload a valid .csv file");
      return;
    }
    setFileName(file.name);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvRawText(content);
    };
    reader.readAsText(file);
  };

  const handleProcessCsv = () => {
    if (!csvRawText) {
      setErrorMsg("No CSV content loaded.");
      return;
    }

    try {
      const { headers, rows } = parseCsvText(csvRawText);
      if (headers.length === 0) {
        throw new Error("Could not parse CSV headers.");
      }

      // Build field definitions
      const fields: FieldDefinition[] = headers.map((header) => {
        const sampleColValues = rows.slice(0, 10).map((row, i) => row[headers.indexOf(header)]);
        const type = inferFieldType(header, sampleColValues);
        return { name: header, type };
      });

      // Build sample records array
      const records: Record<string, any>[] = rows.slice(0, 50).map((row) => {
        const record: Record<string, any> = {};
        headers.forEach((header, idx) => {
          record[header] = row[idx] ?? "";
        });
        return record;
      });

      const resourceName = fileName ? fileName.replace(/\.csv$/i, "") : "imported_csv";
      const cleanSlug = resourceName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");

      onImportSuccess({
        name: resourceName.charAt(0).toUpperCase() + resourceName.slice(1),
        slug: cleanSlug,
        fields,
        records,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process CSV file");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-mb-surface border border-mb-border rounded-xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-mb-border pb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-mb-text" />
            <h2 className="text-base font-semibold text-mb-text">CSV File Schema Importer</h2>
          </div>
          <button onClick={onClose} className="text-mb-text-tertiary hover:text-mb-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-mb-text-secondary leading-relaxed">
          Drag & drop any <code className="text-mb-text font-mono font-bold">.csv</code> file (e.g. <code className="font-mono text-mb-text">MOCK_DATA.csv</code>) to auto-infer fields, types, and populate Endpoint Studio schema.
        </p>

        {errorMsg && (
          <div className="p-3 bg-mb-surface border border-mb-border text-xs text-mb-text rounded-md font-mono">
            {errorMsg}
          </div>
        )}

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileChange(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging ? "border-mb-text bg-mb-bg-raised" : "border-mb-border hover:border-mb-text-tertiary"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
            className="hidden"
          />
          <Upload className="w-8 h-8 text-mb-text-tertiary mx-auto mb-3" />
          <span className="text-xs font-semibold text-mb-text block">
            {fileName ? `Loaded: ${fileName}` : "Click or Drag & Drop CSV File"}
          </span>
          <span className="text-2xs text-mb-text-tertiary block mt-1">Supports standard CSV files with headers</span>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="mb-btn-secondary h-9 px-4 text-xs">
            Cancel
          </button>
          <button
            onClick={handleProcessCsv}
            disabled={!csvRawText}
            className="mb-btn-primary h-9 px-4 text-xs flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Infer Schema & Populate Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
