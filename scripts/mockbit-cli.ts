#!/usr/bin/env tsx

/**
 * Mockbit Headless CI/CD CLI Runner
 * FAANG-grade developer utility for running Mockbit event engine cascades & invariant evaluations in CI pipelines.
 */

import fs from "fs";
import path from "path";
import { ARENA_WORLDS } from "../lib/datasets/arena";
import { runEventCascade, generateArenaRunArtifact } from "../lib/event-engine";

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
┌─────────────────────────────────────────────────────────────┐
│                 Mockbit Headless CI/CD CLI                  │
└─────────────────────────────────────────────────────────────┘

Usage:
  npx tsx scripts/mockbit-cli.ts <command> [options]

Commands:
  run     Run an event cascade simulation for a target world
  list    List all available living enterprise worlds
  export  Export world specification artifact to JSON

Options:
  --world <id>      Target world ID (default: "fintech-billing")
  --ticks <number>  Maximum logical clock ticks to execute (default: 5)
  --output <file>   File path to save execution artifact (default: "arena-run.json")
  --help            Show CLI help and usage options

Examples:
  npx tsx scripts/mockbit-cli.ts run --world fintech-billing --ticks 5
  npx tsx scripts/mockbit-cli.ts list
  npx tsx scripts/mockbit-cli.ts export --world aws-cloud
`);
}

async function main() {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const command = args[0];

  const getArgValue = (flag: string, fallback: string): string => {
    const idx = args.indexOf(flag);
    if (idx !== -1 && idx + 1 < args.length) {
      return args[idx + 1];
    }
    return fallback;
  };

  if (command === "list") {
    console.log(`\n📋 Living Enterprise Worlds in Mockbit Arena™ (${ARENA_WORLDS.length}):\n`);
    ARENA_WORLDS.forEach((w) => {
      console.log(`  • [${w.id}] ${w.name} (${(w.category || "general").toUpperCase()})`);
      console.log(`    Systems: ${w.systems.join(", ")} | Rules: ${w.event_rules.length} | Invariants: ${w.invariants.length}`);
    });
    console.log("\n");
    return;
  }

  if (command === "run") {
    const worldId = getArgValue("--world", "fintech-billing");
    const maxTicks = parseInt(getArgValue("--ticks", "5"), 10);
    const outputFile = getArgValue("--output", "arena-run.json");

    const targetWorld = ARENA_WORLDS.find((w) => w.id === worldId);
    if (!targetWorld) {
      console.error(`❌ World "${worldId}" not found. Available worlds: ${ARENA_WORLDS.map((w) => w.id).join(", ")}`);
      process.exit(1);
    }

    console.log(`🚀 [Mockbit CLI] Running event cascade for world: "${targetWorld.name}" (${maxTicks} ticks)...`);
    const startTime = Date.now();

    const initialEvent = targetWorld.event_cascade[0] || "payment.refunded";
    const result = runEventCascade(
      initialEvent,
      { refund_amount: 150, original_charge: 200, user_id: "usr_99" },
      targetWorld.event_rules,
      targetWorld.invariants,
      targetWorld.workflows,
      undefined,
      targetWorld.id,
      "main",
      maxTicks
    );
    const durationMs = Date.now() - startTime;

    console.log(`\n✅ Execution Complete in ${durationMs}ms:`);
    console.log(`  • World State: ${result.worldState}`);
    console.log(`  • Ticks Executed: ${result.totalTicks}`);
    console.log(`  • Events Dispatched: ${result.allEmittedEvents.length}`);
    console.log(`  • Invariants Passed: ${result.invariantsPassed ? "YES (All Invariants Passed)" : "NO (Invariant Breach Detected)"}`);
    console.log(`  • Execution Hash Digest: ${result.executionHash}`);

    // Save output artifact
    const artifactPath = path.join(process.cwd(), outputFile);
    fs.writeFileSync(artifactPath, JSON.stringify(result, null, 2));

    console.log(`📄 Saved CI execution artifact: ${outputFile}\n`);
    return;
  }

  if (command === "export") {
    const worldId = getArgValue("--world", "fintech-billing");
    const targetWorld = ARENA_WORLDS.find((w) => w.id === worldId);
    if (!targetWorld) {
      console.error(`❌ World "${worldId}" not found.`);
      process.exit(1);
    }

    const outputFile = `${worldId}-spec.json`;
    fs.writeFileSync(path.join(process.cwd(), outputFile), JSON.stringify(targetWorld, null, 2));
    console.log(`📄 Exported world spec to ${outputFile}`);
    return;
  }

  console.error(`❌ Unknown command: "${command}". Run --help for usage.`);
  process.exit(1);
}

main().catch(console.error);
