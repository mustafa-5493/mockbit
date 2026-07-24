import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.ANTHROPIC_API_KEY;
const modelId = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest";

const BEHAVIORS_DIR = path.join(process.cwd(), "lib/datasets/behaviors");
const FAILURES_DIR = path.join(process.cwd(), "lib/datasets/failures");
const BENCHMARKS_DIR = path.join(process.cwd(), "lib/datasets/benchmarks");
const SEMANTICS_DIR = path.join(process.cwd(), "lib/datasets/semantics");

[BEHAVIORS_DIR, FAILURES_DIR, BENCHMARKS_DIR, SEMANTICS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function callClaudeAPI(prompt: string): Promise<any> {
  if (!apiKey || apiKey.startsWith("mock") || apiKey.trim() === "") {
    return null;
  }

  console.log(`📡 [Claude API] Calling live Anthropic API (${modelId})...`);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`⚠️ Claude API returned status ${res.status}: ${errText}`);
      return null;
    }

    const data = await res.json();
    const contentText = data.content?.[0]?.text;
    if (!contentText) return null;

    const jsonMatch = contentText.match(/```json\n([\s\S]*?)\n```/) || contentText.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : contentText;
    return JSON.parse(jsonStr);
  } catch (err: any) {
    console.warn(`⚠️ Live Claude API call encountered error: ${err.message}. Using deterministic fallback assets.`);
    return null;
  }
}

// Pre-compiled Fallback Seed Assets
const SEED_BEHAVIORS = [
  {
    behavior_id: "refund_flow",
    name: "Enterprise Refund & Ledger Reconciliation",
    domain: "finance",
    trigger: "payment.refunded",
    steps: ["ledger.adjust_entry", "tax.update_liability", "customer.notify_email", "audit.append_log"],
    expected_world_state: "RESOLVED",
    required_invariants: ["refund_amount <= original_charge", "ledger_balance_zero"],
    description: "Multi-system event cascade for automated refund processing, tax adjustment, and audit log appending.",
  },
  {
    behavior_id: "subscription_renewal",
    name: "SaaS Subscription Auto-Renewal & Invoicing",
    domain: "billing",
    trigger: "subscription.renewal_due",
    steps: ["payment_gateway.charge_card", "invoice.mark_paid", "entitlements.extend_access", "email.send_receipt"],
    expected_world_state: "HEALTHY",
    required_invariants: ["renewed_until > current_period_end", "invoice_status == paid"],
    description: "Recurring SaaS subscription renewal lifecycle with payment processing and license entitlement extension.",
  },
  {
    behavior_id: "incident_escalation",
    name: "DevOps Automated Incident Escalation & Patch",
    domain: "engineering",
    trigger: "datadog.alert.high_error_rate",
    steps: ["pagerduty.trigger_incident", "slack.notify_oncall", "k8s.rollback_deployment", "jira.create_postmortem"],
    expected_world_state: "RECOVERY",
    required_invariants: ["active_replicas > 0", "error_rate < 0.01"],
    description: "Automated site reliability engineering incident escalation, deployment rollback, and postmortem ticket creation.",
  },
  {
    behavior_id: "shipment_return",
    name: "E-Commerce Return & Warehouse Restock",
    domain: "logistics",
    trigger: "customer.return_initiated",
    steps: ["fedex.generate_return_label", "warehouse.reserve_restock_slot", "stripe.issue_store_credit", "crm.update_timeline"],
    expected_world_state: "RESOLVED",
    required_invariants: ["restock_quantity == return_quantity", "return_label_created == true"],
    description: "E-commerce customer return authorization, carrier label generation, warehouse restock, and credit issuance.",
  },
  {
    behavior_id: "payroll_approval",
    name: "Corporate Payroll Approval & Direct Deposit",
    domain: "hr_finance",
    trigger: "payroll.period_closed",
    steps: ["manager.approve_timesheets", "tax.calculate_withholding", "ach.batch_direct_deposit", "gl.post_payroll_journal"],
    expected_world_state: "HEALTHY",
    required_invariants: ["total_disbursement == net_pay + tax_withheld", "approval_count >= 2"],
    description: "Enterprise HR payroll batch processing, multi-manager approval verification, tax withholding, and ACH direct deposit.",
  },
  {
    behavior_id: "gdpr_erasure",
    name: "GDPR Right-to-be-Forgotten Data Erasure",
    domain: "compliance",
    trigger: "compliance.gdpr_request_submitted",
    steps: ["user_db.anonymize_pii", "analytics.purge_user_events", "s3.scrub_backups", "audit.record_erasure_certificate"],
    expected_world_state: "HEALTHY",
    required_invariants: ["pii_fields_cleared == true", "erasure_certificate_generated == true"],
    description: "Automated GDPR Article 17 Right to Erasure execution scrubbing PII across databases, analytics, and S3 cold storage.",
  },
];

const SEED_FAILURES = [
  {
    failure_id: "duplicate_webhook",
    category: "payments",
    cause: "Network retry without idempotency key headers",
    symptoms: ["duplicate_charge_created", "ledger_imbalance", "double_invoice_receipt"],
    expected_agent_actions: ["detect_duplicate_event_id", "apply_idempotency_lock", "reconcile_ledger_entry"],
    mitigation_rule: "Enforce X-Idempotency-Key header on all POST /charges mutations",
  },
  {
    failure_id: "split_brain_ledger",
    category: "distributed_systems",
    cause: "Database network partition during multi-node transaction commit",
    symptoms: ["node_a_balance != node_b_balance", "stale_read_inconsistency"],
    expected_agent_actions: ["quarantine_partitioned_node", "replay_transaction_log", "re-verify_consensus_state"],
    mitigation_rule: "Reject mutations when node quorum < 51%",
  },
  {
    failure_id: "stale_jwt_replay",
    category: "security",
    cause: "Revoked OAuth JWT token reused after logout event",
    symptoms: ["unauthorized_api_access", "session_hijack_attempt"],
    expected_agent_actions: ["check_token_revocation_list", "emit_security_alert", "force_user_reauthentication"],
    mitigation_rule: "Check token_jti against Redis revocation cache on every request",
  },
  {
    failure_id: "db_deadlock",
    category: "database",
    cause: "Circular row lock dependencies in concurrent SQL transactions",
    symptoms: ["http_500_internal_error", "connection_pool_exhaustion", "transaction_timeout"],
    expected_agent_actions: ["detect_deadlock_error_code", "abort_lowest_priority_transaction", "retry_with_exponential_backoff"],
    mitigation_rule: "Acquire row locks in consistent alphabetical table order",
  },
];

const SEED_BENCHMARKS = [
  {
    benchmark_id: "aws_iam_remediation",
    title: "AWS Cloud Security IAM Violation Remediation",
    target_world: "aws-cloud",
    trigger_event: "aws.iam.policy_violation",
    optimal_path: ["aws.iam.revoke_public_policy", "cloudwatch.alarm.acknowledge", "terraform.remediation.apply", "pagerduty.alert.resolve"],
    max_ticks: 4,
    golden_digest: "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
    description: "Evaluates whether an autonomous SRE agent can detect a public S3 IAM policy breach and apply Terraform remediation in sub-4 ticks.",
  },
  {
    benchmark_id: "saas_churn_recovery",
    title: "Fintech Failed Payment Recovery & Customer Retention",
    target_world: "fintech-billing",
    trigger_event: "stripe.charge.failed",
    optimal_path: ["dunning.schedule_retry", "twilio.send_sms_update", "chargebee.update_grace_period", "zendesk.create_vip_ticket"],
    max_ticks: 5,
    golden_digest: "f39b1a0e88c7d8a9e0123456789abcdef0123456",
    description: "Evaluates whether a billing recovery agent can orchestrate dunning retries and SMS notification before revoking SaaS access.",
  },
];

const SEED_SEMANTICS = [
  {
    endpoint: "/api/v1/public/fintech-billing/refunds",
    domain: "finance",
    semantic_tags: ["financial", "mutation", "high_risk", "requires_audit_log"],
    related_entities: ["charge", "invoice", "ledger_entry"],
    starts_workflows: ["wf_fintech_refund_reconciliation"],
  },
  {
    endpoint: "/api/v1/public/aws-cloud/iam-policies",
    domain: "cloud_security",
    semantic_tags: ["security", "access_control", "high_risk", "compliance_critical"],
    related_entities: ["iam_role", "s3_bucket", "vpc_subnet"],
    starts_workflows: ["wf_aws_sec_remediation"],
  },
  {
    endpoint: "/api/v1/public/salesforce-lead2cash/orders",
    domain: "sales_operations",
    semantic_tags: ["revenue", "order_processing", "contract_bound"],
    related_entities: ["opportunity", "quote", "contract", "invoice"],
    starts_workflows: ["wf_lead_to_cash"],
  },
];

async function generateKnowledgePacks() {
  console.log(`🚀 [Claude Knowledge Compiler] Starting compilation using model: ${modelId}`);

  // Attempt live API query if API key is present
  const liveBehaviors = await callClaudeAPI(
    "Generate an array of 6 JSON objects representing reusable enterprise behaviors. Respond ONLY with valid JSON inside a ```json``` block."
  );
  const behaviorsToSave = liveBehaviors && Array.isArray(liveBehaviors) ? liveBehaviors : SEED_BEHAVIORS;

  behaviorsToSave.forEach((b: any) => {
    const filePath = path.join(BEHAVIORS_DIR, `${b.behavior_id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(b, null, 2));
    console.log(`  ✓ Written Enterprise Behavior: ${b.behavior_id}.json`);
  });

  const liveFailures = await callClaudeAPI(
    "Generate an array of 4 JSON objects representing software failure modes. Respond ONLY with valid JSON inside a ```json``` block."
  );
  const failuresToSave = liveFailures && Array.isArray(liveFailures) ? liveFailures : SEED_FAILURES;

  failuresToSave.forEach((f: any) => {
    const filePath = path.join(FAILURES_DIR, `${f.failure_id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(f, null, 2));
    console.log(`  ✓ Written Failure Atlas mode: ${f.failure_id}.json`);
  });

  SEED_BENCHMARKS.forEach((bm) => {
    const filePath = path.join(BENCHMARKS_DIR, `${bm.benchmark_id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(bm, null, 2));
    console.log(`  ✓ Written Agent Benchmark playbook: ${bm.benchmark_id}.json`);
  });

  fs.writeFileSync(path.join(SEMANTICS_DIR, "api_semantics.json"), JSON.stringify(SEED_SEMANTICS, null, 2));
  console.log(`  ✓ Written Semantic Metadata Registry: api_semantics.json`);

  console.log(`✅ [Claude Knowledge Compiler] Successfully compiled all Knowledge Packs! ($0 runtime cost)`);
}

generateKnowledgePacks().catch(console.error);
