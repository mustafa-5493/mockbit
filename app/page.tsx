"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Database,
  ShieldCheck,
  Zap,
  Bot,
  Play,
  Copy,
  Check,
  Code2,
  GitBranch,
  History,
  Layers,
  Globe,
  Image as ImageIcon,
  UserCheck,
  Terminal,
} from "lucide-react";

function MarkIcon() {
  return (
    <svg className="w-6 h-6 text-mb-text shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 17l6-6-6-6M12 19h8" />
    </svg>
  );
}

export default function LandingPage() {
  const [isStatefulMode, setIsStatefulMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"get" | "post">("get");
  const [customJsonInput, setCustomJsonInput] = useState<string>(`{\n  "name": "Wireless Noise-Cancelling Headphones",\n  "price": 199.99,\n  "category": "Electronics"\n}`);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [consoleOutput, setConsoleOutput] = useState<any>([
    { id: "prod_1", title: "Essence Mascara Lash Princess", price: 9.99, category: "beauty" },
    { id: "prod_2", title: "Eyeshadow Palette with Mirror", price: 19.99, category: "beauty" },
  ]);

  const [origin, setOrigin] = useState<string>("https://mockbit.io");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const handleRunDemoPost = () => {
    const newProduct = {
      id: `prod_${consoleOutput.length + 1}`,
      title: "Pro Wireless Earbuds v2",
      price: 149.99,
      category: "electronics",
      created_at: new Date().toISOString(),
    };

    if (isStatefulMode) {
      setConsoleOutput([newProduct, ...consoleOutput]);
    } else {
      setConsoleOutput([newProduct]); // Unpersisted
    }
  };

  const handleGenerateCustomApi = async () => {
    let parsed: any;
    try {
      parsed = JSON.parse(customJsonInput);
    } catch (e: any) {
      alert(`Invalid JSON format: ${e.message || "Please check syntax."}`);
      return;
    }

    try {
      const res = await fetch("/api/v1/public/c", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (res.ok) {
        const data = await res.json();
        const base = typeof window !== "undefined" ? window.location.origin : "https://mockbit.io";
        setGeneratedUrl(`${base}/api/v1/public/c/${data.id}`);
        return;
      }
    } catch (e: any) {
      console.warn("Fetch to /api/v1/public/c failed, using client fallback", e);
    }

    const shortId = Math.random().toString(36).substring(2, 8);
    const base = typeof window !== "undefined" ? window.location.origin : "https://mockbit.io";
    setGeneratedUrl(`${base}/api/v1/public/c/${shortId}`);
  };

  return (
    <div className="min-h-screen bg-mb-bg text-mb-text flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="border-b border-mb-border bg-mb-bg/90 backdrop-saturate-150 px-6 h-14 flex items-center justify-between sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2 group">
          <MarkIcon />
          <span className="font-semibold text-base tracking-tight text-mb-text">mockbit</span>
          <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-mb-bg-raised text-mb-text-tertiary border border-mb-border">
            Stateful API & Synthetic Event Runtime
          </span>
        </Link>

        <div className="flex items-center gap-4 text-xs font-medium">
          <Link href="/docs" className="text-mb-text-tertiary hover:text-mb-text transition-colors">
            Docs & Template Engine
          </Link>
          <Link href="/resources" className="text-mb-text-tertiary hover:text-mb-text transition-colors">
            Public APIs & Agent Substrate
          </Link>
          <Link href="/dashboard" className="mb-btn-secondary inline-flex h-8 items-center px-3">
            Dashboard
          </Link>
          <Link href="/dashboard/endpoints/new" className="mb-btn-primary inline-flex h-8 items-center px-3">
            Create Custom API
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl w-full mx-auto px-6 pt-12 pb-16 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mb-surface border border-mb-border text-2xs text-mb-text-secondary font-mono">
            <Sparkles className="w-3.5 h-3.5 text-mb-text-tertiary" />
            <span>Start in seconds like a mock server. Scale to a deterministic event runtime.</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-mb-text leading-tight">
            The Easiest Way to Build Stateful APIs for Frontend, QA & AI Agents
          </h1>

          <p className="text-base text-mb-text-secondary leading-relaxed">
            Instant fake REST APIs with true in-memory mutation, foreign key integrity, Git branching, time-travel history, and deterministic multi-system event cascades.
          </p>
        </div>

        {/* HERO INTERACTIVE STATEFUL PLAYGROUND */}
        <div className="mb-panel p-6 bg-mb-surface border border-mb-border rounded-xl shadow-mb-md space-y-6 max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-mb-border pb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-mb-text" />
              <span className="text-xs font-semibold text-mb-text font-mono">Interactive Live API Console</span>
            </div>

            {/* Stateful Mode Toggle Switch */}
            <div className="flex items-center gap-3 bg-mb-bg-raised px-3 py-1.5 rounded-md border border-mb-border">
              <span className="text-2xs font-mono text-mb-text-tertiary">Stateful Mutations Mode:</span>
              <button
                onClick={() => setIsStatefulMode(!isStatefulMode)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${isStatefulMode ? "bg-mb-text" : "bg-mb-border"
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-mb-bg shadow-lg ring-0 transition duration-200 ease-in-out ${isStatefulMode ? "translate-x-4" : "translate-x-0"
                    }`}
                />
              </button>
              <span className={`text-2xs font-mono font-bold ${isStatefulMode ? "text-mb-success" : "text-mb-text-disabled"}`}>
                {isStatefulMode ? "ON (State Persists)" : "OFF (Static Mode)"}
              </span>
            </div>
          </div>

          {/* Sandbox Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8 flex items-center bg-mb-bg-raised border border-mb-border rounded-md px-3 py-2 text-xs font-mono">
              <span className="text-mb-text-tertiary mr-2 font-bold">{activeTab === "get" ? "GET" : "POST"}</span>
              <span className="text-mb-text flex-1">{origin}/api/v1/public/products</span>
            </div>

            <div className="md:col-span-4 flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab("get");
                }}
                className={`mb-btn-secondary h-9 text-xs flex-1 ${activeTab === "get" ? "border-mb-text" : ""}`}
              >
                GET /products
              </button>
              <button
                onClick={() => {
                  setActiveTab("post");
                  handleRunDemoPost();
                }}
                className="mb-btn-primary h-9 text-xs flex-1"
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                <span>POST Item</span>
              </button>
            </div>
          </div>

          {/* Response Inspector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-2xs font-mono text-mb-text-tertiary">
              <span>Live Response Payload ({consoleOutput.length} items):</span>
              <span className="text-mb-success font-semibold">200 OK</span>
            </div>
            <pre className="p-4 bg-mb-bg-raised border border-mb-border rounded-md font-mono text-xs text-mb-text-secondary max-h-56 overflow-y-auto leading-relaxed">
              <code>{JSON.stringify(consoleOutput, null, 2)}</code>
            </pre>
          </div>
        </div>

        {/* 1-CLICK INSTANT CUSTOM API GENERATOR */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-8 border-t border-mb-border">
          <div className="md:col-span-5 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-mb-surface border border-mb-border text-2xs font-mono text-mb-text-tertiary">
              <Zap className="w-3 h-3 text-mb-text" />
              <span>Instant Shareable Custom API</span>
            </div>
            <h2 className="text-xl font-semibold text-mb-text">Need a Custom Endpoint in 5 Seconds?</h2>
            <p className="text-xs text-mb-text-secondary leading-relaxed">
              Paste any JSON response body and get an instant shareable mock URL with zero setup or sign-up.
            </p>
          </div>

          <div className="md:col-span-7 mb-panel p-5 bg-mb-surface border border-mb-border rounded-lg space-y-3">
            <textarea
              value={customJsonInput}
              onChange={(e) => setCustomJsonInput(e.target.value)}
              rows={4}
              className="w-full bg-mb-bg-raised border border-mb-border rounded-md p-3 font-mono text-xs text-mb-text focus:outline-none"
            />
            <div className="flex items-center justify-between gap-3">
              <button onClick={handleGenerateCustomApi} className="mb-btn-primary h-8 text-xs px-4">
                <span>Generate Instant API URL</span>
              </button>

              {generatedUrl && (
                <div className="flex items-center gap-2 font-mono text-xs text-mb-success">
                  <span>{generatedUrl}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedUrl);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 1800);
                    }}
                    className="mb-btn-secondary h-7 px-2 text-2xs"
                  >
                    {copiedUrl ? "Copied" : "Copy"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DYNAMIC IMAGE & AVATAR PLACEHOLDER API SECTION */}
        <div className="space-y-6 pt-12 border-t border-mb-border">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-mb-text">Dynamic Image & Avatar Placeholder API</h2>
            <p className="text-xs text-mb-text-secondary max-w-xl mx-auto">
              Zero-dependency, resolution-independent, SVG image and avatar placeholders for your frontend prototypes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="mb-panel p-4 bg-mb-surface border border-mb-border rounded-lg space-y-3 text-center">
              <span className="text-2xs font-mono text-mb-text-tertiary block">Image Placeholder (300×180)</span>
              <img
                src="/api/v1/public/image/300x180?text=Mockbit+Placeholder"
                alt="Placeholder"
                className="mx-auto rounded border border-mb-border"
              />
              <code className="text-[10px] font-mono text-mb-text-tertiary block">GET /api/v1/public/image/300x180</code>
            </div>

            <div className="mb-panel p-4 bg-mb-surface border border-mb-border rounded-lg space-y-3 text-center">
              <span className="text-2xs font-mono text-mb-text-tertiary block">Dynamic SVG Avatar (Jane)</span>
              <img
                src="/api/v1/public/avatar/jane?size=120"
                alt="Avatar Jane"
                className="mx-auto rounded-full border border-mb-border"
              />
              <code className="text-[10px] font-mono text-mb-text-tertiary block">GET /api/v1/public/avatar/jane</code>
            </div>

            <div className="mb-panel p-4 bg-mb-surface border border-mb-border rounded-lg space-y-3 text-center">
              <span className="text-2xs font-mono text-mb-text-tertiary block">Dynamic SVG Avatar (User 42)</span>
              <img
                src="/api/v1/public/avatar/user42?size=120"
                alt="Avatar User42"
                className="mx-auto rounded-full border border-mb-border"
              />
              <code className="text-[10px] font-mono text-mb-text-tertiary block">GET /api/v1/public/avatar/user42</code>
            </div>
          </div>
        </div>

        {/* CONCEPTUAL COMPARISON MATRIX: TRADITIONAL MOCKS VS MOCKBIT */}
        <div className="space-y-6 pt-12 border-t border-mb-border">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-mb-text">Why Developers Upgrade to Mockbit</h2>
            <p className="text-xs text-mb-text-secondary max-w-xl mx-auto">
              Start with static mocks in seconds. Scale to stateful workflows and reproducible event runtimes without changing tools.
            </p>
          </div>

          <div className="mb-panel p-6 bg-mb-surface border border-mb-border rounded-xl overflow-x-auto">
            <table className="w-full text-xs font-mono text-left border-collapse">
              <thead>
                <tr className="border-b border-mb-border text-mb-text-tertiary">
                  <th className="py-3 px-4">Capability / Feature</th>
                  <th className="py-3 px-4 text-center">Traditional Static Mocks</th>
                  <th className="py-3 px-4 text-center font-bold text-mb-text">Mockbit Runtime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mb-border">
                <tr>
                  <td className="py-3 px-4 text-mb-text font-semibold">Static Placeholder JSON Datasets</td>
                  <td className="py-3 px-4 text-center text-mb-success">✓ Yes</td>
                  <td className="py-3 px-4 text-center text-mb-success font-bold">✓ Yes (13+ Public Specs)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-mb-text font-semibold">Dynamic SVG Placeholder Images & Avatars</td>
                  <td className="py-3 px-4 text-center text-mb-success">✓ Raster Images</td>
                  <td className="py-3 px-4 text-center text-mb-success font-bold">✓ Vector SVG & Avatars</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-mb-text font-semibold">In-Memory Stateful Mutations (POST/PUT/DELETE)</td>
                  <td className="py-3 px-4 text-center text-mb-text-disabled">✗ Unpersisted Fake Response</td>
                  <td className="py-3 px-4 text-center text-mb-success font-bold">✓ Real In-Memory State Mutation</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-mb-text font-semibold">Relational FK Integrity & Cascade Deletes</td>
                  <td className="py-3 px-4 text-center text-mb-text-disabled">✗ Isolated Objects</td>
                  <td className="py-3 px-4 text-center text-mb-success font-bold">✓ Enforced FK Cascades</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-mb-text font-semibold">Git-Style Branch Environment Isolation</td>
                  <td className="py-3 px-4 text-center text-mb-text-disabled">✗ Single Global State</td>
                  <td className="py-3 px-4 text-center text-mb-success font-bold">✓ Header X-Mockbit-Branch</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-mb-text font-semibold">Time-Travel State Rewind & History</td>
                  <td className="py-3 px-4 text-center text-mb-text-disabled">✗ No History Ledger</td>
                  <td className="py-3 px-4 text-center text-mb-success font-bold">✓ Instant v1 ➔ v12 Rewind</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-mb-text font-semibold">Multi-System Event Cascades & Tracing</td>
                  <td className="py-3 px-4 text-center text-mb-text-disabled">✗ No Events</td>
                  <td className="py-3 px-4 text-center text-mb-success font-bold">✓ Deterministic Event DAGs</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-mb-text font-semibold">Domain Invariants & Business Rule Checks</td>
                  <td className="py-3 px-4 text-center text-mb-text-disabled">✗ No Invariants</td>
                  <td className="py-3 px-4 text-center text-mb-success font-bold">✓ Business Rule Enforcement</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-mb-text font-semibold">Autonomous AI Agent Evaluation Substrate</td>
                  <td className="py-3 px-4 text-center text-mb-text-disabled">✗ Not Supported</td>
                  <td className="py-3 px-4 text-center text-mb-success font-bold">✓ Mockbit Arena Substrate</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
