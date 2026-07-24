"use client";

import { useState } from "react";
import { FieldDefinition } from "@/lib/mock-generator";
import { Code2, Copy, Check, X, Terminal, FileCode, Layers } from "lucide-react";

interface SdkGeneratorModalProps {
  endpointName: string;
  slug: string;
  fields: FieldDefinition[];
  responseType: "object" | "array";
  onClose: () => void;
}

export function SdkGeneratorModal({
  endpointName,
  slug,
  fields,
  responseType,
  onClose,
}: SdkGeneratorModalProps) {
  const [activeTab, setActiveTab] = useState<"ts" | "react" | "msw" | "curl">("ts");
  const [copied, setCopied] = useState(false);

  // Capitalize name for TS type
  const typeName =
    endpointName
      .replace(/[^a-zA-Z0-9]/g, "")
      .replace(/^[a-z]/, (c) => c.toUpperCase()) || "ResourceItem";

  // Map Faker types to TypeScript types
  const mapTypeToTs = (type: string) => {
    switch (type) {
      case "number":
      case "currency":
        return "number";
      case "boolean":
        return "boolean";
      case "enum":
        return "string";
      default:
        return "string";
    }
  };

  // Generate TypeScript Interface & API Client
  const generateTsCode = () => {
    const properties = fields
      .map((f) => `  ${f.name}: ${mapTypeToTs(f.type)};`)
      .join("\n");

    const returnType = responseType === "array" ? `${typeName}[]` : typeName;

    return `/**
 * Generated TypeScript Client for ${endpointName}
 * Path: /api/v1/demo/${slug}
 */

export interface ${typeName} {
${properties}
}

export async function fetch${typeName}s(options?: {
  branch?: string;
  scenario?: string;
}): Promise<${returnType}> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options?.branch) headers["X-Mockbit-Branch"] = options.branch;
  if (options?.scenario) headers["X-Mockbit-Scenario"] = options.scenario;

  const res = await fetch("https://mockbit.io/v1/demo/${slug}", { headers });
  if (!res.ok) throw new Error(\`Failed to fetch ${slug}: \${res.statusText}\`);
  return res.json();
}`;
  };

  // Generate TanStack Query Hooks
  const generateReactQueryCode = () => {
    const returnType = responseType === "array" ? `${typeName}[]` : typeName;

    return `import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ${typeName}, fetch${typeName}s } from "./api";

export function use${typeName}s(branch = "main", scenario?: string) {
  return useQuery<${returnType}>({
    queryKey: ["${slug}", branch, scenario],
    queryFn: () => fetch${typeName}s({ branch, scenario }),
  });
}

export function useCreate${typeName}() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newItem: Partial<${typeName}>) => {
      const res = await fetch("https://mockbit.io/v1/demo/${slug}", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["${slug}"] });
    },
  });
}`;
  };

  // Generate MSW Handler
  const generateMswCode = () => {
    return `import { http, HttpResponse } from "msw";

export const ${slug}Handlers = [
  http.get("https://mockbit.io/v1/demo/${slug}", () => {
    return HttpResponse.json([
      // Mockbit fallback dataset
    ]);
  }),
];`;
  };

  // Generate cURL Code
  const generateCurlCode = () => {
    return `# Fetch stateful dataset from Mockbit API
curl -X GET "https://mockbit.io/v1/demo/${slug}" \\
  -H "X-Mockbit-Branch: main" \\
  -H "Accept: application/json"`;
  };

  const getActiveCode = () => {
    switch (activeTab) {
      case "ts":
        return generateTsCode();
      case "react":
        return generateReactQueryCode();
      case "msw":
        return generateMswCode();
      case "curl":
        return generateCurlCode();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-mb-bg border border-mb-border rounded-lg max-w-3xl w-full flex flex-col max-h-[85vh] shadow-mb-md overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-mb-border bg-mb-surface flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-mb-bg-raised border border-mb-border flex items-center justify-center">
              <Code2 className="w-4 h-4 text-mb-text" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-mb-text">Generated SDK & Hooks</h3>
              <p className="text-2xs text-mb-text-tertiary font-mono">/api/v1/demo/{slug}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-mb-surface-hover text-mb-text-tertiary hover:text-mb-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-3 border-b border-mb-border bg-mb-bg-raised flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("ts")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeTab === "ts" ? "bg-mb-surface-active text-mb-text" : "text-mb-text-tertiary hover:text-mb-text"
              }`}
            >
              TypeScript Client
            </button>
            <button
              onClick={() => setActiveTab("react")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeTab === "react" ? "bg-mb-surface-active text-mb-text" : "text-mb-text-tertiary hover:text-mb-text"
              }`}
            >
              TanStack Query Hooks
            </button>
            <button
              onClick={() => setActiveTab("msw")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeTab === "msw" ? "bg-mb-surface-active text-mb-text" : "text-mb-text-tertiary hover:text-mb-text"
              }`}
            >
              MSW Handler
            </button>
            <button
              onClick={() => setActiveTab("curl")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeTab === "curl" ? "bg-mb-surface-active text-mb-text" : "text-mb-text-tertiary hover:text-mb-text"
              }`}
            >
              cURL
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="mb-btn-primary inline-flex h-8 items-center px-3 text-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
            <span>{copied ? "Copied" : "Copy Code"}</span>
          </button>
        </div>

        {/* Code Content Box */}
        <div className="p-5 flex-1 overflow-y-auto bg-mb-bg-raised">
          <pre className="p-4 rounded-md bg-mb-surface border border-mb-border font-mono text-xs text-mb-text-secondary overflow-x-auto leading-relaxed">
            <code>{getActiveCode()}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
