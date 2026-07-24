/**
 * Claude Multi-Step User Journeys Generator Script for Mockbit — Enhanced with Branching & Rich Diffs
 *
 * Usage:
 * ANTHROPIC_API_KEY="sk-ant-..." npx tsx scripts/generate-claude-journeys.ts
 *
 * Pre-generates versioned multi-step state decay sequences (v1 -> v6)
 * with branching terminal outcomes and rich multi-field state diffs.
 */

import fs from "fs";
import path from "path";

let ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  const envLocalPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, "utf-8");
    const match = envContent.match(/ANTHROPIC_API_KEY=["']?([^"'\r\n]+)["']?/);
    if (match && match[1]) {
      ANTHROPIC_API_KEY = match[1].trim();
    }
  }
}

const OUTPUT_DIR = path.join(process.cwd(), "lib", "datasets", "scenarios");

export interface JourneyStep {
  version: number;
  label: string;
  action: string;
  diff: string[];
  branchId?: string;
  branchName?: string;
  state: Record<string, any>;
}

export interface ScenarioPack {
  id: string;
  name: string;
  category: string;
  description: string;
  endpointSlug: string;
  steps: JourneyStep[];
}

function fallbackCartAbandonment(): ScenarioPack {
  return {
    id: "cart-abandonment",
    name: "E-Commerce Cart Abandonment Journey",
    category: "E-Commerce",
    description: "Follows a user creating a cart, adding items, applying a discount, facing payment decline, and session expiration.",
    endpointSlug: "cart",
    steps: [
      {
        version: 1,
        label: "v1: Cart Created",
        action: "POST /cart",
        diff: ["+ cart_id: cart_9901", "+ status: active", "+ items_count: 0"],
        state: { id: "cart_9901", user_id: "usr_101", items: [], subtotal: 0.0, status: "active", coupon: null, checkout_step: "cart", session_active: true },
      },
      {
        version: 2,
        label: "v2: Item Added",
        action: "POST /cart/items",
        diff: ['+ item: "Keychron K2 Keyboard" ($99.99)', "~ subtotal: 0.00 → 99.99", "~ items_count: 0 → 1"],
        state: { id: "cart_9901", user_id: "usr_101", items: [{ id: "prod_1", title: "Keychron K2 Keyboard", price: 99.99, qty: 1 }], subtotal: 99.99, status: "active", coupon: null, checkout_step: "cart", session_active: true },
      },
      {
        version: 3,
        label: "v3: Coupon Applied",
        action: "POST /cart/coupon",
        diff: ['+ coupon: "SAVE20" (-$20.00)', "~ subtotal: 99.99 → 79.99", "+ discount_applied: true"],
        state: { id: "cart_9901", user_id: "usr_101", items: [{ id: "prod_1", title: "Keychron K2 Keyboard", price: 99.99, qty: 1 }], subtotal: 79.99, status: "active", coupon: "SAVE20", discount_applied: true, checkout_step: "cart", session_active: true },
      },
      {
        version: 4,
        label: "v4: Checkout Started",
        action: "POST /checkout",
        diff: ['~ status: "active" → "pending_payment"', '~ checkout_step: "payment_input"', "+ payment_method_entered: true"],
        state: { id: "cart_9901", user_id: "usr_101", items: [{ id: "prod_1", title: "Keychron K2 Keyboard", price: 99.99, qty: 1 }], subtotal: 79.99, status: "pending_payment", coupon: "SAVE20", discount_applied: true, checkout_step: "payment_input", payment_method_entered: true, session_active: true },
      },
      {
        version: 5,
        label: "v5: Payment Failed",
        action: "POST /checkout/pay",
        diff: ['~ status: "pending_payment" → "payment_failed"', '+ error: "card_declined"', "+ retry_attempts: 1", "+ notification_sent: true"],
        state: { id: "cart_9901", user_id: "usr_101", items: [{ id: "prod_1", title: "Keychron K2 Keyboard", price: 99.99, qty: 1 }], subtotal: 79.99, status: "payment_failed", error: "card_declined", coupon: "SAVE20", discount_applied: true, checkout_step: "payment_input", retry_attempts: 1, notification_sent: true, session_active: true },
      },
      {
        version: 6,
        label: "v6: Cart Expired (Terminal)",
        action: "CRON /cart/cleanup",
        diff: ['~ status: "payment_failed" → "abandoned_expired"', "~ session_active: true → false", "+ abandon_email_dispatched: true"],
        state: { id: "cart_9901", user_id: "usr_101", items: [{ id: "prod_1", title: "Keychron K2 Keyboard", price: 99.99, qty: 1 }], subtotal: 79.99, status: "abandoned_expired", error: "card_declined", coupon: "SAVE20", discount_applied: true, checkout_step: "expired", retry_attempts: 1, notification_sent: true, session_active: false, abandon_email_dispatched: true },
      },
    ],
  };
}

function fallbackSubscriptionChurn(): ScenarioPack {
  return {
    id: "subscription-churn",
    name: "SaaS Subscription Churn Journey",
    category: "SaaS & Billing",
    description: "Tracks a customer moving from active trial to credit card failure, retries, past due, and cancellation.",
    endpointSlug: "subscriptions",
    steps: [
      {
        version: 1,
        label: "v1: Trial Active",
        action: "POST /subscriptions",
        diff: ["+ plan: Pro Monthly ($49/mo)", "+ status: trialing", "+ days_remaining: 14"],
        state: { id: "sub_401", customer: "sarah@cyberdyne.com", plan: "Pro Monthly", amount: 49.0, status: "trialing", days_remaining: 14, retries: 0, banner_warning: null, access_granted: true },
      },
      {
        version: 2,
        label: "v2: Trial Expiring Alert",
        action: "EVENT /notifications/trial-ending",
        diff: ['~ status: "trialing" → "trial_ending_soon"', "~ days_remaining: 14 → 1", '+ banner_warning: "Your trial expires in 24 hours"', "+ warning_email_sent: true"],
        state: { id: "sub_401", customer: "sarah@cyberdyne.com", plan: "Pro Monthly", amount: 49.0, status: "trial_ending_soon", days_remaining: 1, retries: 0, banner_warning: "Your trial expires in 24 hours", warning_email_sent: true, access_granted: true },
      },
      {
        version: 3,
        label: "v3: Renewal Failed (Retry 1)",
        action: "POST /invoices/charge",
        diff: ['~ status: "trial_ending_soon" → "past_due"', "~ retries: 0 → 1", '+ last_error: "insufficient_funds"', '+ dunning_email_1_sent: true'],
        state: { id: "sub_401", customer: "sarah@cyberdyne.com", plan: "Pro Monthly", amount: 49.0, status: "past_due", days_remaining: 0, retries: 1, last_error: "insufficient_funds", dunning_email_1_sent: true, access_granted: true },
      },
      {
        version: 4,
        label: "v4: Payment Retry 2 Failed",
        action: "POST /invoices/retry",
        diff: ['~ status: "past_due" → "past_due_final_notice"', "~ retries: 1 → 2", '+ grace_period_hours: 48', '+ dunning_email_2_sent: true'],
        state: { id: "sub_401", customer: "sarah@cyberdyne.com", plan: "Pro Monthly", amount: 49.0, status: "past_due_final_notice", days_remaining: 0, retries: 2, last_error: "insufficient_funds", grace_period_hours: 48, dunning_email_2_sent: true, access_granted: true },
      },
      {
        version: 5,
        label: "v5: Subscription Canceled",
        action: "POST /subscriptions/cancel",
        diff: ['~ status: "past_due_final_notice" → "canceled"', "~ access_granted: true → false", "+ termination_timestamp: ISO", "+ offboarding_survey_triggered: true"],
        state: { id: "sub_401", customer: "sarah@cyberdyne.com", plan: "Pro Monthly", amount: 49.0, status: "canceled", days_remaining: 0, retries: 2, last_error: "insufficient_funds", access_granted: false, termination_timestamp: "2026-01-20T00:00:00Z", offboarding_survey_triggered: true },
      },
      {
        version: 6,
        label: "v6: Winback Offer Dispatched",
        action: "POST /marketing/winback",
        diff: ['+ winback_sent: true', '+ discount_offer: "50% OFF 3 Months"', '+ promo_code: "RETURN50"'],
        state: { id: "sub_401", customer: "sarah@cyberdyne.com", plan: "Pro Monthly", amount: 49.0, status: "canceled", days_remaining: 0, retries: 2, access_granted: false, winback_sent: true, discount_offer: "50% OFF 3 Months", promo_code: "RETURN50" },
      },
    ],
  };
}

function fallbackFraudDetection(): ScenarioPack {
  return {
    id: "fraud-detection",
    name: "Fintech High-Risk Fraud Flow (With Branching Terminal Outcomes)",
    category: "Fintech & Risk",
    description: "Demonstrates a wire transfer flagged for velocity risk score, SMS MFA challenge, and non-linear branching terminal outcomes (Approved vs Account Frozen).",
    endpointSlug: "transfers",
    steps: [
      {
        version: 1,
        label: "v1: Transfer Initiated",
        action: "POST /transfers",
        diff: ["+ transfer_id: txn_8801", "+ amount: $4,500.00", "+ status: pending", "+ risk_score: 12"],
        state: { id: "txn_8801", account: "acc_401", amount: 4500.0, recipient: "external_wire_99", status: "pending", risk_score: 12, mfa_required: false, account_frozen: false },
      },
      {
        version: 2,
        label: "v2: Velocity Check Flagged",
        action: "EVENT /risk/evaluate",
        diff: ['~ risk_score: 12 → 88 (HIGH RISK)', '~ status: "pending" → "flagged_suspicious"', "+ auto_hold_placed: true"],
        state: { id: "txn_8801", account: "acc_401", amount: 4500.0, recipient: "external_wire_99", status: "flagged_suspicious", risk_score: 88, auto_hold_placed: true, mfa_required: false, account_frozen: false },
      },
      {
        version: 3,
        label: "v3: MFA OTP Challenged",
        action: "POST /mfa/challenge",
        diff: ['~ mfa_required: false → true', '~ status: "flagged_suspicious" → "awaiting_mfa"', "+ sms_otp_sent: true", "+ otp_expires_in_secs: 300"],
        state: { id: "txn_8801", account: "acc_401", amount: 4500.0, recipient: "external_wire_99", status: "awaiting_mfa", risk_score: 88, auto_hold_placed: true, mfa_required: true, sms_otp_sent: true, otp_expires_in_secs: 300, mfa_attempts: 0, account_frozen: false },
      },
      {
        version: 4,
        label: "v4: MFA Failed 2x",
        action: "POST /mfa/verify",
        diff: ["~ mfa_attempts: 0 → 2", '+ last_error: "invalid_code_2x"', "+ max_attempts_remaining: 1"],
        state: { id: "txn_8801", account: "acc_401", amount: 4500.0, recipient: "external_wire_99", status: "awaiting_mfa", risk_score: 88, auto_hold_placed: true, mfa_required: true, mfa_attempts: 2, last_error: "invalid_code_2x", max_attempts_remaining: 1, account_frozen: false },
      },
      // Branching Terminal Step A: Approved
      {
        version: 5,
        label: "v5a: MFA Succeeded ➔ Approved",
        action: "POST /mfa/verify (Correct OTP)",
        branchId: "approved",
        branchName: "Branch A: Approved",
        diff: ['~ status: "awaiting_mfa" → "transfer_approved"', "~ auto_hold_placed: true → false", "+ wire_reference: WIRE_889021", "+ funds_released: true"],
        state: { id: "txn_8801", account: "acc_401", amount: 4500.0, recipient: "external_wire_99", status: "transfer_approved", risk_score: 88, auto_hold_placed: false, mfa_required: true, mfa_attempts: 3, wire_reference: "WIRE_889021", funds_released: true, account_frozen: false },
      },
      // Branching Terminal Step B: Frozen
      {
        version: 5,
        label: "v5b: MFA Failed 3x ➔ Account Frozen",
        action: "POST /mfa/verify (Failed 3x)",
        branchId: "frozen",
        branchName: "Branch B: Security Frozen",
        diff: ['~ status: "awaiting_mfa" → "account_frozen_security"', "~ account_frozen: false → true", "+ security_incident_id: INC_4012", "+ fraud_alert_dispatched: true"],
        state: { id: "txn_8801", account: "acc_401", amount: 4500.0, recipient: "external_wire_99", status: "account_frozen_security", risk_score: 88, auto_hold_placed: true, mfa_required: true, mfa_attempts: 3, account_frozen: true, security_incident_id: "INC_4012", fraud_alert_dispatched: true },
      },
    ],
  };
}

async function main() {
  console.log("=== Mockbit Multi-Step User Journeys Generator (Enhanced) ===");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const packs = [fallbackCartAbandonment(), fallbackSubscriptionChurn(), fallbackFraudDetection()];

  for (const pack of packs) {
    const filePath = path.join(OUTPUT_DIR, `${pack.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(pack, null, 2));
    console.log(`✓ Wrote enhanced scenario pack: ${pack.id}.json (${pack.steps.length} steps)`);
  }

  console.log("\n=== Multi-Step User Journeys Ready ===");
}

main().catch(console.error);
