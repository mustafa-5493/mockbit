"use client";

import { Sparkles } from "lucide-react";

interface ContextualEchoToolbarProps {
  onInsertTag: (tagStr: string) => void;
}

export function ContextualEchoToolbar({ onInsertTag }: ContextualEchoToolbarProps) {
  const chips = [
    { label: "+ Body Email", tag: "{{body.email}}" },
    { label: "+ Body Name", tag: "{{body.name}}" },
    { label: "+ Query UserID", tag: "{{query.userId}}" },
    { label: "+ Auth Header", tag: "{{headers.authorization}}" },
    { label: "+ Route ID", tag: "{{params.id}}" },
    { label: "+ Timestamp", tag: "{{timestamp}}" },
    { label: "+ ISO Date", tag: "{{isoDate}}" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1 text-[11px] font-mono">
      <span className="text-2xs text-mb-text-tertiary flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-mb-text" />
        <span>Echo Chips:</span>
      </span>

      {chips.map((c) => (
        <button
          key={c.tag}
          type="button"
          onClick={() => onInsertTag(c.tag)}
          className="px-2 py-0.5 rounded bg-mb-surface hover:bg-mb-surface-active border border-mb-border text-mb-text transition-colors shadow-2xs hover:border-mb-text-tertiary"
          title={`Insert template tag: ${c.tag}`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
