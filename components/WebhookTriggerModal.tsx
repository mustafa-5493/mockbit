"use client";

import { useState } from "react";
import { X, Send, Activity, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface WebhookTriggerModalProps {
  onClose: () => void;
}

export function WebhookTriggerModal({ onClose }: WebhookTriggerModalProps) {
  const [targetUrl, setTargetUrl] = useState<string>("http://localhost:3000/api/v1/echo");
  const [event, setEvent] = useState<string>("payment_intent.succeeded");
  const [secret, setSecret] = useState<string>("whsec_mockbit_test_secret_12345");
  const [payloadText, setPayloadText] = useState<string>(
    JSON.stringify(
      {
        id: "evt_3MtwB2LkdIwHu7ix0X0b0VjX",
        object: "event",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_3MtwB2LkdIwHu7ix0X0b0VjX",
            amount: 4900,
            currency: "usd",
            status: "succeeded",
            customer_email: "alex.developer@example.com",
          },
        },
      },
      null,
      2
    )
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const handleDispatch = async () => {
    try {
      setLoading(true);
      setResult(null);

      let parsedPayload = payloadText;
      try {
        parsedPayload = JSON.parse(payloadText);
      } catch (e) {
        // use raw text string
      }

      const res = await fetch("/api/v1/webhooks/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl,
          event,
          secret,
          payload: parsedPayload,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ success: false, error: err.message || "Network request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-mb-surface border border-mb-border rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-mb-border pb-4">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-mb-text" />
            <h2 className="text-base font-semibold text-mb-text">Dispatch Webhook Event</h2>
          </div>
          <button onClick={onClose} className="text-mb-text-tertiary hover:text-mb-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-mb-text-secondary leading-relaxed">
          Test your local or staging webhook handlers by dispatching synthetic HTTP POST payloads signed with HMAC-SHA256 signatures.
        </p>

        {/* Inputs Form */}
        <div className="space-y-3">
          <div>
            <label className="block text-2xs font-mono text-mb-text-tertiary uppercase mb-1">Target Receiver URL</label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="http://localhost:3000/api/webhooks"
              className="w-full bg-mb-bg border border-mb-border rounded-md px-3 py-1.5 text-xs text-mb-text font-mono focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-mono text-mb-text-tertiary uppercase mb-1">Event Type Name</label>
              <input
                type="text"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="payment_intent.succeeded"
                className="w-full bg-mb-bg border border-mb-border rounded-md px-3 py-1.5 text-xs text-mb-text focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-2xs font-mono text-mb-text-tertiary uppercase mb-1">Signing Secret (HMAC)</label>
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="whsec_secret_key"
                className="w-full bg-mb-bg border border-mb-border rounded-md px-3 py-1.5 text-xs text-mb-text font-mono focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-2xs font-mono text-mb-text-tertiary uppercase mb-1">JSON Event Payload</label>
            <textarea
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              rows={5}
              className="w-full bg-mb-bg border border-mb-border rounded-md p-3 text-xs font-mono text-mb-text focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Dispatch Action */}
        <div className="flex items-center justify-between pt-2 border-t border-mb-border">
          <span className="text-3xs font-mono text-mb-text-tertiary flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-mb-text-tertiary" /> HMAC-SHA256 headers generated automatically
          </span>
          <button
            onClick={handleDispatch}
            disabled={loading || !targetUrl.trim()}
            className="mb-btn-primary h-8 px-4 text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Dispatch Webhook</span>
          </button>
        </div>

        {/* Live Execution Result Logs */}
        {result && (
          <div className="p-3 bg-mb-bg border border-mb-border rounded-lg space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-2xs uppercase tracking-wider text-mb-text-tertiary font-semibold flex items-center gap-1.5">
                {result.success ? (
                  <CheckCircle2 className="w-4 h-4 text-mb-text" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-mb-text-tertiary" />
                )}
                <span>Delivery Log ({result.durationMs}ms)</span>
              </span>
              {result.statusCode && (
                <span className={`px-2 py-0.5 rounded text-3xs font-semibold ${
                  result.statusCode >= 200 && result.statusCode < 300
                    ? "bg-mb-surface border border-mb-border text-mb-text"
                    : "bg-mb-surface border border-mb-border text-mb-text-tertiary"
                }`}>
                  HTTP {result.statusCode} {result.statusText || ""}
                </span>
              )}
            </div>

            {result.signature && (
              <p className="text-3xs text-mb-text-tertiary truncate">
                <span className="text-mb-text font-semibold">Signature:</span> {result.signature}
              </p>
            )}

            {result.responseBody !== undefined && (
              <div>
                <span className="text-3xs text-mb-text-tertiary block mb-1">Target Receiver Response Body:</span>
                <pre className="p-2 bg-mb-surface border border-mb-border rounded max-h-32 overflow-y-auto text-3xs text-mb-text font-mono leading-relaxed">
                  {result.responseBody || "(Empty response body)"}
                </pre>
              </div>
            )}

            {result.error && (
              <p className="text-3xs text-mb-text-tertiary font-semibold">Error: {result.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
