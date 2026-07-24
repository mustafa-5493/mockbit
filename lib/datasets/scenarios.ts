import cartAbandonmentJson from "./scenarios/cart-abandonment.json";
import subscriptionChurnJson from "./scenarios/subscription-churn.json";
import fraudDetectionJson from "./scenarios/fraud-detection.json";

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

export const SCENARIO_PACKS: ScenarioPack[] = [
  cartAbandonmentJson as ScenarioPack,
  subscriptionChurnJson as ScenarioPack,
  fraudDetectionJson as ScenarioPack,
];

export function getScenarioPackById(id: string): ScenarioPack | undefined {
  return SCENARIO_PACKS.find((p) => p.id.toLowerCase() === id.toLowerCase());
}

/**
 * Computes cumulative state delta diff between Step A and Step B
 */
export function computeCumulativeDiff(stateA: Record<string, any>, stateB: Record<string, any>): string[] {
  const diffs: string[] = [];
  const keysA = Object.keys(stateA);
  const keysB = Object.keys(stateB);
  const allKeys = Array.from(new Set([...keysA, ...keysB]));

  for (const key of allKeys) {
    const valA = stateA[key];
    const valB = stateB[key];

    if (!(key in stateA) && key in stateB) {
      diffs.push(`+ ${key}: ${JSON.stringify(valB)}`);
    } else if (key in stateA && !(key in stateB)) {
      diffs.push(`- ${key}: ${JSON.stringify(valA)}`);
    } else if (JSON.stringify(valA) !== JSON.stringify(valB)) {
      diffs.push(`~ ${key}: ${JSON.stringify(valA)} → ${JSON.stringify(valB)}`);
    }
  }

  return diffs.length > 0 ? diffs : ["No cumulative state changes between selected versions"];
}
