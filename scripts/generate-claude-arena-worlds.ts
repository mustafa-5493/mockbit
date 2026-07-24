/**
 * Claude Multi-Stage World Generator Script for Mockbit Arena™ — 6 Enterprise Worlds Expansion
 *
 * Usage:
 * npx tsx scripts/generate-claude-arena-worlds.ts
 *
 * Pre-generates canonical synthetic world universes:
 * - fintech-billing.json
 * - devops-incident.json
 * - commerce-retail.json
 * - healthcare-fhir.json
 * - salesforce-lead2cash.json
 * - aws-cloud.json
 */

import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "lib", "datasets", "arena");

export interface ExecutableWorkflow {
  id: string;
  name: string;
  start_event: string;
  required_events: string[];
  success_event: string;
  failure_event: string;
}

export interface DomainInvariant {
  id: string;
  description: string;
  check_field: string;
  operator: "less_than_or_equal" | "equals" | "greater_than" | "not_null";
  check_value: any;
  on_fail_emit: string;
}

export interface EventRuleAction {
  type: "create" | "update" | "append" | "emit" | "score";
  resource?: string;
  entity_id?: string;
  event?: string;
  delta?: Record<string, any>;
  score_metric?: string;
  score_value?: number;
}

export interface EventRule {
  trigger: string;
  condition?: {
    field: string;
    operator: "equals" | "greater_than" | "less_than" | "contains";
    value: any;
  };
  actions: EventRuleAction[];
}

export interface ArenaWorld {
  id: string;
  name: string;
  tagline: string;
  category: string;
  description: string;
  systems: string[];
  entity_graph: string[];
  event_cascade: string[];
  event_rules: EventRule[];
  invariants: DomainInvariant[];
  workflows: ExecutableWorkflow[];
  endpoints: {
    system: string;
    method: string;
    path: string;
    description: string;
  }[];
  agent_index_rubric: {
    tool_correctness: number;
    workflow_completion: number;
    recovery_intelligence: number;
    state_efficiency: number;
    safety_score: number;
  };
  sample_python_sdk: string;
}

function generateFintechWorld(): ArenaWorld {
  return {
    id: "fintech-billing",
    name: "Fintech & Revenue Cloud",
    tagline: "Digital Money Movement & Multi-System Billing Engine",
    category: "Financial Infrastructure",
    description: "Simulates digital identity, Plaid bank linking, Stripe subscriptions, Chargebee invoicing, QuickBooks accounting, tax calculation, and fraud chargebacks.",
    systems: ["Identity API", "Plaid Banking", "Stripe Checkout", "Chargebee Billing", "QuickBooks Accounting", "Tax Engine", "Fraud Radar", "Audit Log"],
    entity_graph: ["Organization", "Users", "Customers", "Bank Accounts", "Subscriptions", "Invoices", "Charges", "Refunds", "Disputes", "Tax Records", "Audit Events"],
    event_cascade: [
      "Customer Created (Identity API)",
      "Email & Identity Verified",
      "Bank Account Linked & Micro-deposits Verified (Plaid)",
      "Subscription Started ($49/mo Pro)",
      "Invoice & Tax Calculated (Chargebee / Tax Engine)",
      "Payment Charge Attempt 1 Failed (Card Locked)",
      "Payment Charge Attempt 2 Failed ➔ Past Due Status",
      "Customer Files Chargeback Dispute",
      "Fraud Radar Investigation Initiated",
      "Refund Dispatched & QuickBooks Ledger Updated",
      "Case Closed & Audit Event Emitted",
    ],
    workflows: [
      {
        id: "wf_dispute_recovery",
        name: "Customer Dispute & Ledger Recovery Workflow",
        start_event: "stripe.refund.created",
        required_events: ["accounting.ledger.updated", "tax.refund.pending", "audit.record.append"],
        success_event: "analytics.refund.logged",
        failure_event: "arena.invariant.failed",
      },
    ],
    invariants: [
      {
        id: "inv_refund_limit",
        description: "Refund amount cannot exceed original charge",
        check_field: "amount",
        operator: "less_than_or_equal",
        check_value: 500.0,
        on_fail_emit: "arena.invariant.failed",
      },
      {
        id: "inv_tax_balance",
        description: "Adjusted tax due cannot be negative",
        check_field: "adjusted_tax_due",
        operator: "greater_than",
        check_value: -1.0,
        on_fail_emit: "arena.invariant.failed",
      },
    ],
    event_rules: [
      {
        trigger: "stripe.refund.created",
        actions: [
          { type: "create", resource: "ledger_entry", delta: { entry_type: "refund_credit", amount: -49.0, status: "posted" } },
          { type: "emit", event: "accounting.ledger.updated", delta: { ledger_synced: true } },
          { type: "emit", event: "tax.refund.pending", delta: { tax_reversal: -4.41 } },
          { type: "emit", event: "audit.record.append", delta: { audit_log: "Customer refund processed & accounting ledger updated" } },
        ],
      },
      {
        trigger: "accounting.ledger.updated",
        condition: { field: "ledger_synced", operator: "equals", value: true },
        actions: [
          { type: "update", resource: "quickbooks_journal", delta: { sync_status: "COMPLETED", journal_id: "jno_8891" } },
          { type: "emit", event: "analytics.refund.logged", delta: { metrics_updated: true } },
        ],
      },
      {
        trigger: "tax.refund.pending",
        actions: [
          { type: "update", resource: "tax_ledger", delta: { adjusted_tax_due: 0.0 } },
        ],
      },
    ],
    endpoints: [
      { system: "Identity API", method: "POST", path: "/v1/customers", description: "Create customer identity record" },
      { system: "Plaid", method: "POST", path: "/v1/link/bank-account", description: "Link external bank account & verify micro-deposits" },
      { system: "Stripe", method: "POST", path: "/v1/subscriptions", description: "Create recurring billing subscription" },
      { system: "Stripe", method: "POST", path: "/v1/charges/refund", description: "Issue customer refund & reverse ledger" },
      { system: "Chargebee", method: "GET", path: "/v1/invoices/:id", description: "Retrieve itemized invoice with tax calculation" },
      { system: "QuickBooks", method: "POST", path: "/v1/ledger/entries", description: "Post double-entry accounting journal entry" },
    ],
    agent_index_rubric: {
      tool_correctness: 98.4,
      workflow_completion: 94.2,
      recovery_intelligence: 89.6,
      state_efficiency: 91.8,
      safety_score: 99.1,
    },
    sample_python_sdk: `from mockbit_arena import Arena

arena = Arena()
world = arena.load_world(
    "fintech-billing",
    branch="agent-run-104",
    scenario="payment_failure_dispute"
)

agent.configure(
    api_base=world.base_url,
    headers={"X-Mockbit-Branch": world.branch_id}
)

result = arena.evaluate(agent)
print(f"Mockbit Agent Index Score: {result.score} / 100")`,
  };
}

function generateDevOpsWorld(): ArenaWorld {
  return {
    id: "devops-incident",
    name: "DevOps & Engineering Cloud",
    tagline: "Autonomous Incident Response & CI/CD Deployment Pipeline",
    category: "Software Engineering",
    description: "Simulates GitHub PR merges, Kubernetes ReplicaSets, Datadog metric spikes, PagerDuty alerts, Slack war rooms, and automated rollback workflows.",
    systems: ["GitHub", "Jenkins / CI", "Kubernetes", "AWS EC2", "Datadog Telemetry", "PagerDuty", "Slack War Room", "Terraform Vault"],
    entity_graph: ["Repositories", "Pull Requests", "CI Builds", "Container Deployments", "Kubernetes Pods", "Alert Incidents", "Slack Channels", "Postmortems"],
    event_cascade: [
      "Pull Request Merged to main (GitHub)",
      "CI Container Build & Security Scanning (Jenkins)",
      "Kubernetes ReplicaSet Updated & Deployed to Production",
      "CPU & Latency Metric Spike Detected (Datadog)",
      "HIGH P1 Incident Alert Dispatched (PagerDuty)",
      "Automated Slack War Room Channel Created (#incident-4012)",
      "Agent Evaluates Metrics & Triggers K8s Rollback",
      "Pod Health Normalized & Datadog Metrics Recovered",
      "PagerDuty Alert Resolved & Root Cause Postmortem Logged",
    ],
    workflows: [
      {
        id: "wf_incident_rollback",
        name: "Kubernetes Incident Rollback & Recovery Workflow",
        start_event: "github.pr.merged",
        required_events: ["k8s.deployment.updated", "datadog.metric.spiked"],
        success_event: "slack.channel.created",
        failure_event: "arena.invariant.failed",
      },
    ],
    invariants: [
      {
        id: "inv_cpu_limit",
        description: "Container CPU utilization must not exceed 100%",
        check_field: "cpu_user",
        operator: "less_than_or_equal",
        check_value: 100.0,
        on_fail_emit: "arena.invariant.failed",
      },
    ],
    event_rules: [
      {
        trigger: "github.pr.merged",
        actions: [
          { type: "create", resource: "jenkins_build", delta: { build_number: 402, status: "SUCCESS" } },
          { type: "emit", event: "k8s.deployment.updated", delta: { image: "api-service:v2.4.1", replicas: 5 } },
        ],
      },
      {
        trigger: "k8s.deployment.updated",
        actions: [
          { type: "update", resource: "datadog_metrics", delta: { cpu_user: 98.4, error_rate: 0.14 } },
          { type: "emit", event: "datadog.metric.spiked", delta: { alert_level: "P1_CRITICAL" } },
        ],
      },
      {
        trigger: "datadog.metric.spiked",
        actions: [
          { type: "create", resource: "pagerduty_incident", delta: { incident_id: "INC_4012", title: "CPU & Latency Spike on API Service" } },
          { type: "emit", event: "slack.channel.created", delta: { channel: "#incident-4012-war-room" } },
        ],
      },
    ],
    endpoints: [
      { system: "GitHub", method: "POST", path: "/repos/owner/app/pulls/42/merge", description: "Merge Pull Request to main" },
      { system: "Kubernetes", method: "PATCH", path: "/apis/apps/v1/namespaces/prod/deployments/api-service", description: "Update container image or rollback replica set" },
      { system: "Datadog", method: "GET", path: "/api/v1/query?query=avg:system.cpu.user", description: "Query real-time metric timeseries" },
      { system: "PagerDuty", method: "POST", path: "/incidents/:id/resolve", description: "Resolve active P1 security/outage incident" },
      { system: "Slack", method: "POST", path: "/conversations.create", description: "Create dedicated incident war room channel" },
    ],
    agent_index_rubric: {
      tool_correctness: 96.8,
      workflow_completion: 91.5,
      recovery_intelligence: 94.1,
      state_efficiency: 88.9,
      safety_score: 97.5,
    },
    sample_python_sdk: `from mockbit_arena import Arena

arena = Arena()
world = arena.load_world(
    "devops-incident",
    branch="agent-incident-4012",
    scenario="cpu_spike_rollback"
)

agent.configure(api_base=world.base_url)
result = arena.evaluate(agent)
print(f"Incident Recovery Speed: {result.metrics['recovery_intelligence']}%")`,
  };
}

function generateSalesforceWorld(): ArenaWorld {
  return {
    id: "salesforce-lead2cash",
    name: "Salesforce Lead-to-Cash",
    tagline: "Enterprise CRM, CPQ Quotes, NetSuite ERP & Order Fulfill",
    category: "Enterprise Revenue Engine",
    description: "Simulates Lead conversion, CPQ Quote generation, DocuSign e-Signature contracts, NetSuite ERP orders, Stripe invoicing, and QuickBooks ledger balancing.",
    systems: ["Salesforce CRM", "CPQ Engine", "DocuSign Contracts", "NetSuite ERP", "Stripe Invoicing", "QuickBooks Ledger", "Audit Trail"],
    entity_graph: ["Leads", "Contacts", "Accounts", "Opportunities", "Quotes", "Contracts", "Orders", "Invoices", "Payments"],
    event_cascade: [
      "Lead Qualified & Converted to Contact/Account (Salesforce)",
      "Opportunity Marked Closed-Won ($120,000 ARR)",
      "CPQ Itemized Quote Approved",
      "DocuSign Executive E-Signature Executed",
      "NetSuite ERP Sales Order & Fulfillment Created",
      "Stripe Electronic Invoice Issued",
      "Payment Authorized & QuickBooks Ledger Balanced",
    ],
    workflows: [
      {
        id: "wf_lead_to_cash",
        name: "Salesforce Lead-to-Cash End-to-End Workflow",
        start_event: "salesforce.opportunity.closed_won",
        required_events: ["cpq.quote.approved", "docusign.contract.signed", "netsuite.order.created"],
        success_event: "stripe.invoice.paid",
        failure_event: "arena.invariant.failed",
      },
    ],
    invariants: [
      {
        id: "inv_opp_account",
        description: "Closed-Won Opportunity must have an associated Account ID",
        check_field: "account_id",
        operator: "not_null",
        check_value: null,
        on_fail_emit: "arena.invariant.failed",
      },
      {
        id: "inv_invoice_balance",
        description: "Invoice total must equal order ARR total ($120,000)",
        check_field: "amount",
        operator: "less_than_or_equal",
        check_value: 120000.0,
        on_fail_emit: "arena.invariant.failed",
      },
    ],
    event_rules: [
      {
        trigger: "salesforce.opportunity.closed_won",
        actions: [
          { type: "create", resource: "cpq_quote", delta: { quote_id: "Q_9901", status: "APPROVED", amount: 120000.0 } },
          { type: "emit", event: "cpq.quote.approved", delta: { quote_approved: true } },
        ],
      },
      {
        trigger: "cpq.quote.approved",
        actions: [
          { type: "create", resource: "docusign_contract", delta: { contract_id: "CTR_4021", signed: true } },
          { type: "emit", event: "docusign.contract.signed", delta: { contract_signed: true } },
        ],
      },
      {
        trigger: "docusign.contract.signed",
        actions: [
          { type: "create", resource: "netsuite_order", delta: { order_id: "ORD_8801", arr: 120000.0 } },
          { type: "emit", event: "netsuite.order.created", delta: { order_synced: true } },
        ],
      },
      {
        trigger: "netsuite.order.created",
        actions: [
          { type: "create", resource: "stripe_invoice", delta: { invoice_id: "inv_99012", paid: true } },
          { type: "emit", event: "stripe.invoice.paid", delta: { payment_complete: true } },
        ],
      },
    ],
    endpoints: [
      { system: "Salesforce", method: "POST", path: "/services/data/v58.0/sobjects/Opportunity", description: "Create or update CRM Opportunity" },
      { system: "CPQ Engine", method: "POST", path: "/v1/quotes/approve", description: "Approve itemized CPQ Quote" },
      { system: "DocuSign", method: "POST", path: "/v2.1/accounts/:id/envelopes", description: "Send e-signature contract envelope" },
      { system: "NetSuite", method: "POST", path: "/api/rest/v1/salesOrder", description: "Create NetSuite ERP sales order" },
    ],
    agent_index_rubric: {
      tool_correctness: 99.2,
      workflow_completion: 96.4,
      recovery_intelligence: 91.0,
      state_efficiency: 93.5,
      safety_score: 99.8,
    },
    sample_python_sdk: `from mockbit_arena import Arena

arena = Arena()
world = arena.load_world("salesforce-lead2cash", branch="agent-l2c-401")
result = arena.evaluate(agent)`,
  };
}

function generateAwsWorld(): ArenaWorld {
  return {
    id: "aws-cloud",
    name: "AWS Cloud Infrastructure",
    tagline: "AWS IAM Security, VPC Subnets, S3 Buckets & Remediation",
    category: "Cloud Infrastructure",
    description: "Simulates AWS IAM policy enforcement, VPC Subnet isolation, EC2 Instances, S3 Bucket public access policies, CloudWatch Alarms, and Terraform automated remediation.",
    systems: ["AWS IAM", "AWS VPC", "AWS EC2", "AWS S3", "AWS CloudWatch", "Terraform Vault", "PagerDuty Alert"],
    entity_graph: ["IAM Policies", "VPC Subnets", "EC2 Instances", "S3 Buckets", "CloudWatch Alarms", "Terraform Runs", "Incident Alerts"],
    event_cascade: [
      "IAM Policy Modified (Public Access Allowed on S3 Bucket)",
      "AWS CloudWatch Security Metric Alarm Triggered",
      "PagerDuty HIGH P1 Alert Dispatched to Security Ops",
      "Agent Inspects IAM Policy & Initiates Remediation",
      "Terraform Security Run Executed (Public Access Blocked)",
      "CloudWatch Metric Alarm Normalized & Incident Closed",
    ],
    workflows: [
      {
        id: "wf_aws_sec_remediation",
        name: "AWS Cloud Security Automated Remediation Workflow",
        start_event: "aws.iam.policy_violation",
        required_events: ["cloudwatch.alarm.triggered", "pagerduty.alert.dispatched"],
        success_event: "terraform.remediation.applied",
        failure_event: "arena.invariant.failed",
      },
    ],
    invariants: [
      {
        id: "inv_s3_public",
        description: "Public S3 bucket access requires explicit security policy override",
        check_field: "is_public",
        operator: "equals",
        check_value: false,
        on_fail_emit: "arena.invariant.failed",
      },
    ],
    event_rules: [
      {
        trigger: "aws.iam.policy_violation",
        actions: [
          { type: "update", resource: "s3_bucket", delta: { bucket_name: "prod-customer-data", is_public: true } },
          { type: "emit", event: "cloudwatch.alarm.triggered", delta: { alarm_id: "ALM_9901", severity: "CRITICAL" } },
        ],
      },
      {
        trigger: "cloudwatch.alarm.triggered",
        actions: [
          { type: "create", resource: "pagerduty_alert", delta: { alert_id: "ALT_4019", title: "S3 Public Bucket Violation Detected" } },
          { type: "emit", event: "pagerduty.alert.dispatched", delta: { alert_sent: true } },
        ],
      },
      {
        trigger: "pagerduty.alert.dispatched",
        actions: [
          { type: "update", resource: "s3_bucket", delta: { is_public: false } },
          { type: "emit", event: "terraform.remediation.applied", delta: { remediation_complete: true } },
        ],
      },
    ],
    endpoints: [
      { system: "AWS IAM", method: "POST", path: "/v1/iam/policies/evaluate", description: "Evaluate IAM policy statement rules" },
      { system: "AWS S3", method: "PUT", path: "/v1/s3/buckets/:id/policy", description: "Update S3 bucket public access block policy" },
      { system: "CloudWatch", method: "GET", path: "/v1/cloudwatch/alarms", description: "Query active security metric alarms" },
      { system: "Terraform", method: "POST", path: "/v1/runs/apply", description: "Execute Terraform infrastructure remediation" },
    ],
    agent_index_rubric: {
      tool_correctness: 98.8,
      workflow_completion: 95.1,
      recovery_intelligence: 93.4,
      state_efficiency: 91.2,
      safety_score: 99.5,
    },
    sample_python_sdk: `from mockbit_arena import Arena

arena = Arena()
world = arena.load_world("aws-cloud", branch="agent-aws-sec-01")
result = arena.evaluate(agent)`,
  };
}

function generateCommerceWorld(): ArenaWorld {
  return {
    id: "commerce-retail",
    name: "Commerce & Logistics Cloud",
    tagline: "Retail Order Lifecycle, Warehouse Inventory & Return Support",
    category: "Retail & E-Commerce",
    description: "Simulates customer checkout, warehouse inventory reservation, Twilio SMS notifications, FedEx shipping, returns, coupon fraud, and CRM support.",
    systems: ["Shopify Catalog", "Inventory Warehouse", "Stripe Checkout", "FedEx Shipping", "Twilio SMS", "Klaviyo CRM", "Support Desk"],
    entity_graph: ["Customers", "Catalog Products", "Warehouse Stock", "Orders", "Payments", "Shipments", "SMS Notifications", "Return Requests"],
    event_cascade: [
      "Customer Cart Created & Item Added (Shopify)",
      "Stock Reserved at Warehouse (Inventory Engine)",
      "Payment Authorized & Charged (Stripe)",
      "Shipping Label & Tracking Code Generated (FedEx)",
      "SMS Shipping Confirmation Dispatched (Twilio)",
      "Carrier Delay Event Simulated (Lost Package)",
      "Customer Initiates Support Return Request",
      "Refund Dispatched & Inventory Restocked",
    ],
    workflows: [],
    invariants: [],
    event_rules: [
      {
        trigger: "shopify.order.created",
        actions: [
          { type: "update", resource: "warehouse_stock", delta: { reserved_qty: 1, available_qty: 9 } },
          { type: "emit", event: "fedex.label.generated", delta: { tracking_number: "TRK_99018273" } },
        ],
      },
      {
        trigger: "fedex.label.generated",
        actions: [
          { type: "create", resource: "twilio_sms", delta: { recipient: "+15550192837", body: "Your order has shipped! Tracking: TRK_99018273" } },
        ],
      },
    ],
    endpoints: [
      { system: "Shopify", method: "POST", path: "/admin/api/orders.json", description: "Create e-commerce order" },
      { system: "Inventory", method: "POST", path: "/v1/warehouse/reserve", description: "Reserve physical stock items" },
      { system: "FedEx", method: "POST", path: "/v1/shipments/label", description: "Generate shipping label & tracking number" },
      { system: "Twilio", method: "POST", path: "/v1/Messages.json", description: "Send SMS notification update" },
    ],
    agent_index_rubric: {
      tool_correctness: 97.2,
      workflow_completion: 93.8,
      recovery_intelligence: 91.0,
      state_efficiency: 92.4,
      safety_score: 98.6,
    },
    sample_python_sdk: `from mockbit_arena import Arena

arena = Arena()
world = arena.load_world("commerce-retail", branch="agent-order-99")
result = arena.evaluate(agent)`,
  };
}

function generateHealthcareWorld(): ArenaWorld {
  return {
    id: "healthcare-fhir",
    name: "Healthcare & EHR Network",
    tagline: "Patient Care Lifecycle, FHIR Interoperability & Claims",
    category: "Healthcare Infrastructure",
    description: "Simulates Epic Systems EHR patient admission, vitals tracking, lab results, doctor review, insurance prior authorization, and HIPAA audit logging.",
    systems: ["Epic Systems EHR", "FHIR Interoperability", "Lab System", "Insurance Claims", "Pharmacy Dispenser", "HIPAA Audit Logger"],
    entity_graph: ["Patients", "Appointments", "Encounters", "Vitals", "Lab Tests", "Prescriptions", "Insurance Claims", "HIPAA Audit Events"],
    event_cascade: [
      "Patient Encounter Created (Epic Systems)",
      "Vitals & Symptoms Recorded (FHIR)",
      "Blood Test Requested & Lab Results Uploaded",
      "Doctor Review & Electronic Prescription Issued",
      "Insurance Prior Authorization Submitted",
      "Medication Dispensed at Pharmacy",
      "HIPAA Compliance Access Log Saved",
    ],
    workflows: [],
    invariants: [],
    event_rules: [
      {
        trigger: "epic.patient.admitted",
        actions: [
          { type: "create", resource: "fhir_observation", delta: { vitals: "120/80 mmHg", heart_rate: 72 } },
          { type: "emit", event: "lab.bloodtest.requested", delta: { lab_order_id: "LAB_7701" } },
        ],
      },
      {
        trigger: "lab.bloodtest.requested",
        actions: [
          { type: "create", resource: "pharmacy_prescription", delta: { rx_code: "RX_40129", status: "PENDING_PRIOR_AUTH" } },
          { type: "emit", event: "insurance.claim.submitted", delta: { claim_id: "CLM_88019" } },
        ],
      },
    ],
    endpoints: [
      { system: "Epic EHR", method: "POST", path: "/api/FHIR/R4/Patient", description: "Register FHIR patient record" },
      { system: "Lab System", method: "GET", path: "/api/FHIR/R4/Observation", description: "Query diagnostic lab results" },
      { system: "Insurance", method: "POST", path: "/v1/claims/prior-auth", description: "Submit prior authorization claim" },
      { system: "HIPAA Audit", method: "POST", path: "/v1/audit/logs", description: "Log compliance data access event" },
    ],
    agent_index_rubric: {
      tool_correctness: 99.1,
      workflow_completion: 96.0,
      recovery_intelligence: 92.8,
      state_efficiency: 94.5,
      safety_score: 99.8,
    },
    sample_python_sdk: `from mockbit_arena import Arena

arena = Arena()
world = arena.load_world("healthcare-fhir", branch="agent-hipaa-audit")
result = arena.evaluate(agent)`,
  };
}

async function main() {
  console.log("=== Mockbit Arena™ World Generator (6 Enterprise Worlds) ===");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const worlds = [
    generateFintechWorld(),
    generateDevOpsWorld(),
    generateCommerceWorld(),
    generateHealthcareWorld(),
    generateSalesforceWorld(),
    generateAwsWorld(),
  ];

  for (const w of worlds) {
    const filePath = path.join(OUTPUT_DIR, `${w.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(w, null, 2));
    console.log(`✓ Wrote Arena world: ${w.id}.json (${w.workflows.length} workflows, ${w.event_rules.length} rules, ${w.invariants.length} invariants)`);
  }

  console.log("\n=== All 6 Mockbit Arena™ Enterprise Worlds Ready ===");
}

main().catch(console.error);
