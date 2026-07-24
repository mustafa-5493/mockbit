import securityJson from "./resilience/security.json";
import unicodeJson from "./resilience/unicode.json";
import boundaryJson from "./resilience/boundary.json";

export interface VectorItem {
  id: string;
  category: string;
  target: "body" | "query" | "header" | "path";
  field_type_hint: "string" | "numeric" | "json_object" | "jwt_header" | "filename";
  payload: any;
  payload_b64?: string;
  expected_safe_behavior: string;
  expected_assertion: {
    status_not: number;
    body_not_contains: string[];
    response_sanitized: boolean;
  };
  description: string;
}

export interface ResilienceBundle {
  id: string;
  name: string;
  category: string;
  description: string;
  totalVectors: number;
  vectors: VectorItem[];
}

export const RESILIENCE_BUNDLES: ResilienceBundle[] = [
  securityJson as ResilienceBundle,
  unicodeJson as ResilienceBundle,
  boundaryJson as ResilienceBundle,
];

export function getResilienceBundleById(id: string): ResilienceBundle | undefined {
  return RESILIENCE_BUNDLES.find((b) => b.id.toLowerCase() === id.toLowerCase());
}
