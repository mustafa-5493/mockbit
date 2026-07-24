"use client";

import { useState } from "react";
import { ConditionalRule } from "@/lib/mock-generator";
import {
  X,
  Plus,
  Sliders,
  Send,
  Zap,
  CheckCircle2,
  Code2,
  Globe,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface CalloutRuleBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRule: (rule: ConditionalRule) => void;
  initialRule?: ConditionalRule;
}

export function CalloutRuleBuilderModal({
  isOpen,
  onClose,
  onSaveRule,
  initialRule,
}: CalloutRuleBuilderModalProps) {
  const [target, setTarget] = useState<ConditionalRule["target"]>(
    initialRule?.target || "header"
  );
  const [key, setKey] = useState(initialRule?.key || "");
  const [operator, setOperator] = useState<ConditionalRule["operator"]>(
    initialRule?.operator || "equals"
  );
  const [value, setValue] = useState(initialRule?.value || "");
  const [responseStatus, setResponseStatus] = useState(
    initialRule?.responseStatus || 200
  );
  const [responseBody, setResponseBody] = useState(
    initialRule?.responseBody || '{\n  "status": "success",\n  "message": "Callout rule executed"\n}'
  );

  // Callout Rule Fields
  const [enableCallout, setEnableCallout] = useState(
    Boolean(initialRule?.calloutUrl)
  );
  const [calloutUrl, setCalloutUrl] = useState(initialRule?.calloutUrl || "");
  const [calloutMode, setCalloutMode] = useState<"sync" | "async">(
    initialRule?.calloutMode || "sync"
  );
  const [calloutMethod, setCalloutMethod] = useState<
    "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  >(initialRule?.calloutMethod || "POST");
  const [calloutPayload, setCalloutPayload] = useState(
    initialRule?.calloutPayload ||
      '{\n  "originalUser": "{{oReqBody \'user.email\'}}",\n  "queryCategory": "{{oReqQueryParam \'category\'}}"\n}'
  );

  if (!isOpen) return null;

  const handleSave = () => {
    const newRule: ConditionalRule = {
      id: initialRule?.id || `rule_${Math.random().toString(36).substring(2, 9)}`,
      target,
      key,
      operator,
      value,
      responseStatus: Number(responseStatus) || 200,
      responseBody,
      calloutUrl: enableCallout ? calloutUrl : undefined,
      calloutMode: enableCallout ? calloutMode : undefined,
      calloutMethod: enableCallout ? calloutMethod : undefined,
      calloutPayload: enableCallout ? calloutPayload : undefined,
    };
    onSaveRule(newRule);
    onClose();
  };

  const insertHelper = (snippet: string) => {
    setCalloutPayload((prev) => prev + snippet);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-mb-surface border border-mb-border rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-mb-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-mb-accent/10 text-mb-accent">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-mb-text">
                {initialRule ? "Edit Callout & Matching Rule" : "Configure Advanced Rule & Callout"}
              </h2>
              <p className="text-xs text-mb-text-secondary">
                Set request matching conditions and trigger synchronous/asynchronous HTTP callouts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-mb-text-tertiary hover:text-mb-text hover:bg-mb-bg-raised transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Request Matching Criteria */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-mb-text-tertiary flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-mb-accent" />
            <span>1. Request Matching Conditions</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Target */}
            <div>
              <label className="block text-2xs font-mono uppercase text-mb-text-tertiary mb-1">
                Target Source
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as any)}
                className="w-full bg-mb-bg border border-mb-border rounded-md px-3 py-1.5 text-xs text-mb-text focus:outline-hidden focus:border-mb-accent font-mono"
              >
                <option value="header">Header</option>
                <option value="query">Query Parameter</option>
                <option value="body">JSON Body (Dot Notation)</option>
                <option value="soap_action">SOAPAction Operation</option>
              </select>
            </div>

            {/* Key */}
            <div>
              <label className="block text-2xs font-mono uppercase text-mb-text-tertiary mb-1">
                Field Key / Path
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={
                  target === "body"
                    ? "user.preferences.theme"
                    : target === "header"
                    ? "Authorization"
                    : "category"
                }
                className="w-full bg-mb-bg border border-mb-border rounded-md px-3 py-1.5 text-xs text-mb-text focus:outline-hidden focus:border-mb-accent font-mono"
              />
            </div>

            {/* Operator */}
            <div>
              <label className="block text-2xs font-mono uppercase text-mb-text-tertiary mb-1">
                Operator
              </label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value as any)}
                className="w-full bg-mb-bg border border-mb-border rounded-md px-3 py-1.5 text-xs text-mb-text focus:outline-hidden focus:border-mb-accent font-mono"
              >
                <option value="equals">Equals (=)</option>
                <option value="not_equals">Does Not Equal (≠)</option>
                <option value="contains">Contains (in)</option>
                <option value="not_contains">Does Not Contain (∉)</option>
                <option value="missing">Is Missing</option>
                <option value="is_null">Is Null</option>
                <option value="is_not_null">Is Not Null</option>
                <option value="greater_than">Greater Than (&gt;)</option>
                <option value="less_than">Less Than (&lt;)</option>
              </select>
            </div>
          </div>

          {/* Value */}
          {!["missing", "is_null", "is_not_null"].includes(operator) && (
            <div>
              <label className="block text-2xs font-mono uppercase text-mb-text-tertiary mb-1">
                Expected Value
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. dark, 200, Bearer token_xyz"
                className="w-full bg-mb-bg border border-mb-border rounded-md px-3 py-1.5 text-xs text-mb-text focus:outline-hidden focus:border-mb-accent font-mono"
              />
            </div>
          )}
        </div>

        {/* Section 2: Mocked Response Parameters */}
        <div className="space-y-3 pt-2 border-t border-mb-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-mb-text-tertiary flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-mb-accent" />
            <span>2. Mocked Response Output</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-2xs font-mono uppercase text-mb-text-tertiary mb-1">
                HTTP Status Code
              </label>
              <input
                type="number"
                value={responseStatus}
                onChange={(e) => setResponseStatus(Number(e.target.value))}
                className="w-full bg-mb-bg border border-mb-border rounded-md px-3 py-1.5 text-xs text-mb-text focus:outline-hidden focus:border-mb-accent font-mono"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-2xs font-mono uppercase text-mb-text-tertiary mb-1">
                Response Payload (JSON / Text)
              </label>
              <textarea
                value={responseBody}
                onChange={(e) => setResponseBody(e.target.value)}
                rows={3}
                className="w-full bg-mb-bg border border-mb-border rounded-md px-3 py-1.5 text-xs text-mb-text font-mono focus:outline-hidden focus:border-mb-accent"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Dual Mode HTTP Callout / Proxy Rule */}
        <div className="space-y-4 pt-2 border-t border-mb-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableCalloutToggle"
                checked={enableCallout}
                onChange={(e) => setEnableCallout(e.target.checked)}
                className="rounded border-mb-border text-mb-accent focus:ring-mb-accent bg-mb-bg"
              />
              <label
                htmlFor="enableCalloutToggle"
                className="text-xs font-semibold text-mb-text flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-mb-accent" />
                <span>Enable HTTP Callout / Webhook Proxy Rule</span>
              </label>
            </div>

            {enableCallout && (
              <span className="text-2xs font-mono text-mb-accent bg-mb-accent/10 px-2 py-0.5 rounded border border-mb-accent/20">
                Beeceptor Neutralizer Active
              </span>
            )}
          </div>

          {enableCallout && (
            <div className="space-y-4 p-4 rounded-lg bg-mb-bg border border-mb-border animate-in fade-in duration-150">
              {/* Sync vs Async Mode Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCalloutMode("sync")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    calloutMode === "sync"
                      ? "bg-mb-surface border-mb-accent text-mb-text shadow-sm"
                      : "bg-mb-bg border-mb-border text-mb-text-tertiary hover:text-mb-text"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-mb-accent" />
                    <span className="text-xs font-semibold">Synchronous (Wait & Proxy)</span>
                  </div>
                  <p className="text-2xs text-mb-text-secondary leading-relaxed">
                    Original request waits for callout response. Full target response is routed back to caller.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCalloutMode("async")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    calloutMode === "async"
                      ? "bg-mb-surface border-mb-accent text-mb-text shadow-sm"
                      : "bg-mb-bg border-mb-border text-mb-text-tertiary hover:text-mb-text"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-4 h-4 text-mb-accent" />
                    <span className="text-xs font-semibold">Asynchronous (Background)</span>
                  </div>
                  <p className="text-2xs text-mb-text-secondary leading-relaxed">
                    Returns instant mock response to caller, then dispatches non-blocking callout in background.
                  </p>
                </button>
              </div>

              {/* Callout URL & Method */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-2xs font-mono uppercase text-mb-text-tertiary mb-1">
                    HTTP Method
                  </label>
                  <select
                    value={calloutMethod}
                    onChange={(e) => setCalloutMethod(e.target.value as any)}
                    className="w-full bg-mb-surface border border-mb-border rounded-md px-3 py-1.5 text-xs text-mb-text focus:outline-hidden focus:border-mb-accent font-mono"
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-2xs font-mono uppercase text-mb-text-tertiary mb-1">
                    Target Webhook / API URL
                  </label>
                  <input
                    type="url"
                    value={calloutUrl}
                    onChange={(e) => setCalloutUrl(e.target.value)}
                    placeholder="https://api.example.com/webhooks/orders"
                    className="w-full bg-mb-surface border border-mb-border rounded-md px-3 py-1.5 text-xs text-mb-text focus:outline-hidden focus:border-mb-accent font-mono"
                  />
                </div>
              </div>

              {/* Callout Payload & Quick Insertion Helpers */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-2xs font-mono uppercase text-mb-text-tertiary">
                    Callout Request Payload
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xs text-mb-text-tertiary">Insert Helpers:</span>
                    <button
                      type="button"
                      onClick={() => insertHelper("{{oReqBody 'user.email'}}")}
                      className="px-2 py-0.5 rounded bg-mb-surface border border-mb-border text-2xs font-mono text-mb-text-secondary hover:text-mb-text hover:border-mb-accent transition-colors"
                    >
                      + oReqBody
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHelper("{{oResBody 'token'}}")}
                      className="px-2 py-0.5 rounded bg-mb-surface border border-mb-border text-2xs font-mono text-mb-text-secondary hover:text-mb-text hover:border-mb-accent transition-colors"
                    >
                      + oResBody
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHelper("{{oReqQueryParam 'category'}}")}
                      className="px-2 py-0.5 rounded bg-mb-surface border border-mb-border text-2xs font-mono text-mb-text-secondary hover:text-mb-text hover:border-mb-accent transition-colors"
                    >
                      + oReqQueryParam
                    </button>
                  </div>
                </div>

                <textarea
                  value={calloutPayload}
                  onChange={(e) => setCalloutPayload(e.target.value)}
                  rows={4}
                  className="w-full bg-mb-surface border border-mb-border rounded-md px-3 py-1.5 text-xs text-mb-text font-mono focus:outline-hidden focus:border-mb-accent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-mb-border">
          <button
            onClick={onClose}
            className="mb-btn-secondary inline-flex h-9 items-center px-4 text-xs"
          >
            <span>Cancel</span>
          </button>

          <button
            onClick={handleSave}
            className="mb-btn-primary inline-flex h-9 items-center px-4 text-xs gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Rule & Callout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
