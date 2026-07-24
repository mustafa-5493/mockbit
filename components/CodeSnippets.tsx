"use client";

import { useState } from "react";

/**
 * CodeSnippets
 * Stripe/Vercel-docs style code preview: tabbed languages, a single
 * copy action, muted syntax tokens. No glow, no matrix-green, no
 * gradient borders — one panel treatment (`mb-panel`) throughout.
 */

type Snippet = {
  id: string;
  label: string;
  filename: string;
  lines: React.ReactNode[];
};

interface CodeSnippetsProps {
  url?: string;
  method?: string;
  endpoint?: any;
}

const SNIPPETS: Snippet[] = [
  {
    id: "curl",
    label: "cURL",
    filename: "terminal",
    lines: [
      <>
        <Tok t="bracket">$</Tok> curl <Tok t="string">https://mockbit.io/v1/mocks/checkout</Tok> {"\\"}
      </>,
      <>
        {"  "}-H <Tok t="string">&quot;Authorization: Bearer mb_live_••••2f81&quot;</Tok> {"\\"}
      </>,
      <>
        {"  "}-H <Tok t="string">&quot;Content-Type: application/json&quot;</Tok>
      </>,
    ],
  },
  {
    id: "node",
    label: "Node",
    filename: "index.ts",
    lines: [
      <>
        <Tok t="kw">import</Tok> {"{ "}mockbit{" }"} <Tok t="kw">from</Tok>{" "}
        <Tok t="string">&quot;@mockbit/sdk&quot;</Tok>;
      </>,
      <> </>,
      <>
        <Tok t="kw">const</Tok> res = <Tok t="kw">await</Tok> mockbit.
        <Tok t="key">endpoints</Tok>.<Tok t="key">create</Tok>({"{"}
      </>,
      <>
        {"  "}
        <Tok t="key">path</Tok>: <Tok t="string">&quot;/checkout&quot;</Tok>,
      </>,
      <>
        {"  "}
        <Tok t="key">method</Tok>: <Tok t="string">&quot;POST&quot;</Tok>,
      </>,
      <>
        {"  "}
        <Tok t="key">state</Tok>: <Tok t="string">&quot;persist&quot;</Tok>,
      </>,
      <>{"});"}</>,
    ],
  },
  {
    id: "response",
    label: "Response",
    filename: "200 OK",
    lines: [
      <>{"{"}</>,
      <>
        {"  "}
        <Tok t="key">&quot;id&quot;</Tok>: <Tok t="string">&quot;ep_9k2n4x&quot;</Tok>,
      </>,
      <>
        {"  "}
        <Tok t="key">&quot;path&quot;</Tok>: <Tok t="string">&quot;/checkout&quot;</Tok>,
      </>,
      <>
        {"  "}
        <Tok t="key">&quot;status&quot;</Tok>: <Tok t="number">200</Tok>,
      </>,
      <>
        {"  "}
        <Tok t="key">&quot;version&quot;</Tok>: <Tok t="number">14</Tok>,
      </>,
      <>{"}"}</>,
    ],
  },
  {
    id: "headers",
    label: "Branch & Scenario Headers",
    filename: "headers.sh",
    lines: [
      <>
        <Tok t="bracket"># Target specific git branch state or scenario preset dynamically</Tok>
      </>,
      <>
        curl <Tok t="string">https://mockbit.io/v1/mocks/orders</Tok> {"\\"}
      </>,
      <>
        {"  "}-H <Tok t="string">&quot;X-Mockbit-Branch: pr-104&quot;</Tok> {"\\"}
      </>,
      <>
        {"  "}-H <Tok t="string">&quot;X-Mockbit-Scenario: expired-card&quot;</Tok>
      </>,
    ],
  },
];

function Tok({
  t,
  children,
}: {
  t: "kw" | "key" | "string" | "bracket" | "number";
  children: React.ReactNode;
}) {
  const cls =
    t === "kw"
      ? "text-mb-text-secondary"
      : t === "key"
      ? "text-mb-key"
      : t === "string"
      ? "text-mb-string"
      : t === "number"
      ? "text-mb-number"
      : "text-mb-bracket";
  return <span className={cls}>{children}</span>;
}

export function CodeSnippets({ url, method, endpoint }: CodeSnippetsProps = {}) {
  const [active, setActive] = useState(SNIPPETS[0].id);
  const [copied, setCopied] = useState(false);
  const current = SNIPPETS.find((s) => s.id === active)!;

  function handleCopy() {
    const text = current.lines
      .map((l) => (typeof l === "string" ? l : ""))
      .join("\n");
    navigator.clipboard?.writeText(text || current.filename).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="mb-panel overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-mb-border px-2">
        <div className="flex items-center gap-1 py-2">
          {SNIPPETS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`rounded-md px-2.5 py-1.5 text-[13px] font-medium tracking-tight transition-colors duration-120 ${
                active === s.id
                  ? "bg-mb-surface-active text-mb-text"
                  : "text-mb-text-tertiary hover:text-mb-text-secondary"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleCopy}
          className="mr-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-mb-text-tertiary transition-colors duration-120 hover:bg-mb-surface-hover hover:text-mb-text-secondary"
        >
          {copied ? (
            <>
              <CheckIcon /> Copied
            </>
          ) : (
            <>
              <CopyIcon /> Copy
            </>
          )}
        </button>
      </div>

      {/* File/context line */}
      <div className="flex items-center gap-1.5 border-b border-mb-border px-4 py-2 text-2xs text-mb-text-tertiary">
        <DotIcon />
        <span className="font-mono">{current.filename}</span>
      </div>

      {/* Code body */}
      <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-[1.7]">
        <code className="font-mono">
          {current.lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="mr-4 w-4 select-none text-right text-mb-text-disabled">
                {i + 1}
              </span>
              <span className="text-mb-text-secondary">{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

export default CodeSnippets;

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" />
      <path
        d="M10.5 5.5V3.5C10.5 2.94772 10.0523 2.5 9.5 2.5H3.5C2.94772 2.5 2.5 2.94772 2.5 3.5V9.5C2.5 10.0523 2.94772 10.5 3.5 10.5H5.5"
        stroke="currentColor"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8.5L6.2 11.5L13 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DotIcon() {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{ backgroundColor: "var(--mb-border-hover)" }}
    />
  );
}
