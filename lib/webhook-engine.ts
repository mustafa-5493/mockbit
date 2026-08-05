import crypto from "crypto";
import { after } from "next/server";
import { isSafeExternalUrl } from "@/lib/url-safety";

export interface WebhookPayload {
  event: string;
  timestamp: string;
  endpoint_id?: string;
  action: "POST" | "PUT" | "DELETE";
  data: any;
}

/**
 * Non-blocking outgoing HTTP Webhook dispatcher
 * Uses Next.js 15 after() when running inside HTTP request contexts on serverless platforms,
 * falling back to Promise.resolve().then(...) otherwise.
 */
export function dispatchWebhook(
  webhookUrl: string,
  secret: string | undefined,
  action: "POST" | "PUT" | "DELETE",
  data: any,
  endpointId?: string
): void {
  if (!webhookUrl || !isSafeExternalUrl(webhookUrl).safe) return;

  const payload: WebhookPayload = {
    event: `mockbit.mutation.${action.toLowerCase()}`,
    timestamp: new Date().toISOString(),
    endpoint_id: endpointId,
    action,
    data,
  };

  const bodyString = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Mockbit-Webhook-Engine/1.0",
    "X-Mockbit-Event": payload.event,
    "X-Mockbit-Delivery": `del_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  };

  if (secret) {
    const signature = crypto.createHmac("sha256", secret).update(bodyString).digest("hex");
    headers["X-Mockbit-Signature"] = `sha256=${signature}`;
  }

  const runDispatch = async () => {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: bodyString,
      });
    } catch {
      // Silently swallow webhook dispatch failures to prevent blocking core API response
    }
  };

  try {
    after(runDispatch);
  } catch {
    Promise.resolve().then(runDispatch);
  }
}
