import fintechBillingJson from "./arena/fintech-billing.json";
import devopsIncidentJson from "./arena/devops-incident.json";
import commerceRetailJson from "./arena/commerce-retail.json";
import healthcareFhirJson from "./arena/healthcare-fhir.json";
import salesforceLead2CashJson from "./arena/salesforce-lead2cash.json";
import awsCloudJson from "./arena/aws-cloud.json";
import { EventRule, DomainInvariant, ExecutableWorkflow } from "../event-engine";

export interface ArenaEndpoint {
  system: string;
  method: string;
  path: string;
  description: string;
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
  endpoints: ArenaEndpoint[];
  agent_index_rubric: {
    tool_correctness: number;
    workflow_completion: number;
    recovery_intelligence: number;
    state_efficiency: number;
    safety_score: number;
  };
  sample_python_sdk: string;
}

export const ARENA_WORLDS: ArenaWorld[] = [
  fintechBillingJson as unknown as ArenaWorld,
  devopsIncidentJson as unknown as ArenaWorld,
  salesforceLead2CashJson as unknown as ArenaWorld,
  awsCloudJson as unknown as ArenaWorld,
  commerceRetailJson as unknown as ArenaWorld,
  healthcareFhirJson as unknown as ArenaWorld,
];

export function getArenaWorldById(id: string): ArenaWorld | undefined {
  return ARENA_WORLDS.find((w) => w.id.toLowerCase() === id.toLowerCase());
}
