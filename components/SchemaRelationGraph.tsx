"use client";

import { EntityRelation } from "@/lib/mock-generator";
import { Link as LinkIcon, ArrowRight, ShieldAlert } from "lucide-react";

interface SchemaRelationGraphProps {
  currentEndpointSlug: string;
  relations: EntityRelation[];
}

export function SchemaRelationGraph({
  currentEndpointSlug,
  relations,
}: SchemaRelationGraphProps) {
  if (relations.length === 0) {
    return (
      <div className="p-6 mb-panel text-center space-y-2">
        <LinkIcon className="w-6 h-6 text-mb-text-disabled mx-auto" />
        <h4 className="text-xs font-semibold text-mb-text">No Foreign Key Relations Declared</h4>
        <p className="text-2xs text-mb-text-tertiary max-w-xs mx-auto">
          Add a relation above (e.g. <code className="font-mono text-mb-text">user_id ➔ users.id</code>) to visualize entity linkages and cascade delete routes.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 mb-panel bg-mb-surface space-y-4">
      <div className="flex items-center justify-between border-b border-mb-border pb-3">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-mb-text" />
          <h4 className="text-xs font-semibold text-mb-text">Entity Relationship Diagram</h4>
        </div>
        <span className="text-2xs font-mono text-mb-text-tertiary">
          {relations.length} active link(s)
        </span>
      </div>

      <div className="space-y-3">
        {relations.map((rel, idx) => (
          <div
            key={rel.id || idx}
            className="p-3 rounded-md bg-mb-bg-raised border border-mb-border flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            {/* Source Node */}
            <div className="flex items-center gap-2 bg-mb-surface px-3 py-1.5 rounded border border-mb-border font-mono text-2xs">
              <span className="text-mb-text font-bold">{currentEndpointSlug || "this_endpoint"}</span>
              <span className="text-mb-text-tertiary">.{rel.foreignKey || "fk"}</span>
            </div>

            {/* Relation Connector Line */}
            <div className="flex items-center gap-1.5 text-2xs text-mb-text-tertiary font-mono">
              <span className="px-1.5 py-0.5 rounded bg-mb-surface border border-mb-border text-mb-text-secondary">
                {rel.type === "belongsTo" ? "belongs_to" : "has_many"}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-mb-text-tertiary" />
            </div>

            {/* Target Node */}
            <div className="flex items-center gap-2 bg-mb-surface px-3 py-1.5 rounded border border-mb-border font-mono text-2xs">
              <span className="text-mb-text font-bold">{rel.targetEndpoint || "target"}</span>
              <span className="text-mb-text-tertiary">.{rel.targetKey || "id"}</span>
            </div>

            {/* Cascade Action Badge */}
            <div className="flex items-center gap-1 text-2xs">
              {rel.onDelete === "cascade" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-mb-bg-raised border border-mb-border text-mb-error font-mono">
                  <ShieldAlert className="w-3 h-3 text-mb-error" />
                  <span>Cascade Delete</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-mb-bg-raised border border-mb-border text-mb-text-tertiary font-mono">
                  {rel.onDelete || "setNull"}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
