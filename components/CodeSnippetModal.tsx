"use client";

import { useState } from "react";
import { X, Code2, Copy, Check, Terminal } from "lucide-react";
import {
  generateCurlSnippet,
  generateFetchSnippet,
  generateAxiosSnippet,
  generatePythonRequestsSnippet,
  generateGoSnippet,
  generatePhpSnippet,
  generateJavaSnippet,
  generateSwiftSnippet,
  SnippetParams,
} from "@/lib/code-snippets";

interface CodeSnippetModalProps {
  onClose: () => void;
  snippetParams: SnippetParams;
}

export function CodeSnippetModal({ onClose, snippetParams }: CodeSnippetModalProps) {
  const [activeLang, setActiveLang] = useState<string>("curl");
  const [copied, setCopied] = useState<boolean>(false);

  const getActiveCode = (): string => {
    switch (activeLang) {
      case "curl": return generateCurlSnippet(snippetParams);
      case "fetch": return generateFetchSnippet(snippetParams);
      case "axios": return generateAxiosSnippet(snippetParams);
      case "python": return generatePythonRequestsSnippet(snippetParams);
      case "go": return generateGoSnippet(snippetParams);
      case "php": return generatePhpSnippet(snippetParams);
      case "java": return generateJavaSnippet(snippetParams);
      case "swift": return generateSwiftSnippet(snippetParams);
      default: return generateCurlSnippet(snippetParams);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const languages = [
    { id: "curl", name: "cURL" },
    { id: "fetch", name: "JS (fetch)" },
    { id: "axios", name: "JS (axios)" },
    { id: "python", name: "Python" },
    { id: "go", name: "Go" },
    { id: "php", name: "PHP" },
    { id: "java", name: "Java" },
    { id: "swift", name: "Swift" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-mb-surface border border-mb-border rounded-xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-mb-border pb-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-mb-text" />
            <h2 className="text-base font-semibold text-mb-text">Multi-Language Client Code Exporter</h2>
          </div>
          <button onClick={onClose} className="text-mb-text-tertiary hover:text-mb-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-mb-text-secondary leading-relaxed">
          Production-ready, copyable HTTP client request snippets for your target stack.
        </p>

        {/* Language Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-mb-border font-mono text-xs">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setActiveLang(lang.id)}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap border ${
                activeLang === lang.id
                  ? "bg-mb-surface text-mb-text border-mb-border font-semibold shadow-sm"
                  : "bg-transparent text-mb-text-tertiary border-transparent hover:text-mb-text"
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>

        {/* Code Snippet Box */}
        <div className="relative group">
          <div className="absolute right-3 top-3 z-10">
            <button
              onClick={handleCopy}
              className="mb-btn-secondary h-7 px-2.5 text-2xs font-mono flex items-center gap-1.5 shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-mb-success" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Code"}</span>
            </button>
          </div>

          <pre className="p-4 bg-mb-bg border border-mb-border rounded-lg font-mono text-xs text-mb-key max-h-72 overflow-y-auto leading-relaxed">
            <code>{getActiveCode()}</code>
          </pre>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="mb-btn-secondary h-9 px-4 text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
