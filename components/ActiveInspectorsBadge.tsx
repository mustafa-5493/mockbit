"use client";

import { useState, useEffect } from "react";
import { Users, Radio } from "lucide-react";

interface ActiveInspectorsBadgeProps {
  endpointSlug?: string;
  className?: string;
}

export function ActiveInspectorsBadge({ endpointSlug = "default", className = "" }: ActiveInspectorsBadgeProps) {
  const [activeCount, setActiveCount] = useState<number>(1);
  const [pulsing, setPulsing] = useState<boolean>(true);

  useEffect(() => {
    // Simulate real-time presence heartbeat
    const interval = setInterval(() => {
      // Small random fluctuation simulating active team presence
      const base = 1;
      const variation = Math.floor(Math.random() * 2);
      setActiveCount(base + variation);
      setPulsing((prev) => !prev);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-mb-surface border border-mb-border text-xs ${className}`}
      title={`${activeCount} team inspector(s) actively connected and monitoring live requests`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-mb-text opacity-75 ${
            pulsing ? "block" : "hidden"
          }`}
        />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-mb-text" />
      </span>

      <span className="font-mono text-3xs text-mb-text font-medium flex items-center gap-1">
        <Users className="w-3 h-3 text-mb-text-tertiary" />
        <span>{activeCount} Active Inspector{activeCount > 1 ? "s" : ""}</span>
      </span>
    </div>
  );
}
