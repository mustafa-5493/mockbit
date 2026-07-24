import refundFlow from "./behaviors/refund_flow.json";
import subscriptionRenewal from "./behaviors/subscription_renewal.json";
import incidentEscalation from "./behaviors/incident_escalation.json";
import shipmentReturn from "./behaviors/shipment_return.json";
import payrollApproval from "./behaviors/payroll_approval.json";
import gdprErasure from "./behaviors/gdpr_erasure.json";

import duplicateWebhook from "./failures/duplicate_webhook.json";
import splitBrainLedger from "./failures/split_brain_ledger.json";
import staleJwtReplay from "./failures/stale_jwt_replay.json";
import dbDeadlock from "./failures/db_deadlock.json";

import awsIamRemediation from "./benchmarks/aws_iam_remediation.json";
import saasChurnRecovery from "./benchmarks/saas_churn_recovery.json";

import apiSemantics from "./semantics/api_semantics.json";

export interface EnterpriseBehavior {
  behavior_id: string;
  name: string;
  domain: string;
  trigger: string;
  steps: string[];
  expected_world_state: string;
  required_invariants: string[];
  description: string;
}

export interface FailureMode {
  failure_id: string;
  category: string;
  cause: string;
  symptoms: string[];
  expected_agent_actions: string[];
  mitigation_rule: string;
}

export interface AgentBenchmark {
  benchmark_id: string;
  title: string;
  target_world: string;
  trigger_event: string;
  optimal_path: string[];
  max_ticks: number;
  golden_digest: string;
  description: string;
}

export interface SemanticMetadata {
  endpoint: string;
  domain: string;
  semantic_tags: string[];
  related_entities: string[];
  starts_workflows: string[];
}

export const ENTERPRISE_BEHAVIORS: EnterpriseBehavior[] = [
  refundFlow as EnterpriseBehavior,
  subscriptionRenewal as EnterpriseBehavior,
  incidentEscalation as EnterpriseBehavior,
  shipmentReturn as EnterpriseBehavior,
  payrollApproval as EnterpriseBehavior,
  gdprErasure as EnterpriseBehavior,
];

export const FAILURE_ATLAS: FailureMode[] = [
  duplicateWebhook as FailureMode,
  splitBrainLedger as FailureMode,
  staleJwtReplay as FailureMode,
  dbDeadlock as FailureMode,
];

export const AGENT_BENCHMARKS: AgentBenchmark[] = [
  awsIamRemediation as AgentBenchmark,
  saasChurnRecovery as AgentBenchmark,
];

export const SEMANTIC_METADATA: SemanticMetadata[] = apiSemantics as SemanticMetadata[];
