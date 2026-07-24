"use client";

import { useState } from "react";
import { generateMockResponse, ScenarioPreset, StateSnapshot } from "@/lib/mock-generator";
import { createSnapshot, listSnapshots, restoreSnapshot, applyScenarioPreset } from "@/lib/store-engine";
import {
  Database,
  Search,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  X,
  Check,
  Code2,
  GitBranch,
  Camera,
  Layers,
  Link as LinkIcon,
} from "lucide-react";

interface StoreInspectorDrawerProps {
  endpoint: any;
  onClose: () => void;
  onUpdateEndpoint: (updatedEp: any) => void;
}

export function StoreInspectorDrawer({
  endpoint,
  onClose,
  onUpdateEndpoint,
}: StoreInspectorDrawerProps) {
  const [activeBranch, setActiveBranch] = useState("main");
  const [activeTab, setActiveTab] = useState<"records" | "snapshots" | "scenarios">("records");

  const getInitialRecords = (): Record<string, any>[] => {
    if (Array.isArray(endpoint.schema_json?.records)) {
      return endpoint.schema_json.records;
    }
    const generated = generateMockResponse(
      endpoint.schema_json || {},
      endpoint.response_type || "array",
      endpoint.array_length || 5,
      undefined,
      endpoint.seed
    );
    return Array.isArray(generated) ? generated : [generated];
  };

  const [records, setRecords] = useState<Record<string, any>[]>(getInitialRecords());
  const [searchQuery, setSearchQuery] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editJsonText, setEditJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Snapshot State
  const [newSnapshotName, setNewSnapshotName] = useState("");
  const [snapshots, setSnapshots] = useState<StateSnapshot[]>(listSnapshots("demo"));

  // Scenario Presets
  const scenarios: ScenarioPreset[] = endpoint.schema_json?.scenarios || endpoint.scenarios || [
    {
      id: "scen_expired_card",
      name: "Expired Credit Card",
      description: "Returns card_declined payment status",
      records: [
        {
          id: "ord_expired_99",
          customer_name: "Sarah Connor",
          total_amount: 199.99,
          status: "payment_failed",
          error_code: "card_expired",
          created_at: new Date().toISOString(),
        },
      ],
    },
    {
      id: "scen_empty_inventory",
      name: "Empty Inventory",
      description: "Simulates out of stock state",
      records: [],
    },
  ];

  const filteredRecords = records.filter((rec) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return JSON.stringify(rec).toLowerCase().includes(q);
  });

  const saveRecordsToStore = (newRecords: Record<string, any>[]) => {
    setRecords(newRecords);
    const updatedEp = {
      ...endpoint,
      schema_json: {
        ...endpoint.schema_json,
        records: newRecords,
      },
    };
    onUpdateEndpoint(updatedEp);
  };

  const handleResetStore = () => {
    if (confirm("Reset store data back to clean seed values?")) {
      const fresh = generateMockResponse(
        endpoint.schema_json || {},
        endpoint.response_type || "array",
        endpoint.array_length || 5,
        undefined,
        endpoint.seed
      );
      const list = Array.isArray(fresh) ? fresh : [fresh];
      saveRecordsToStore(list);
    }
  };

  const handleCreateSnapshot = () => {
    const name = newSnapshotName.trim() || `checkpoint-${Date.now()}`;
    createSnapshot("demo", activeBranch, name);
    setSnapshots(listSnapshots("demo"));
    setNewSnapshotName("");
  };

  const handleRestoreSnapshot = (snapId: string) => {
    const ok = restoreSnapshot("demo", activeBranch, snapId);
    if (ok) {
      alert("Snapshot restored successfully!");
    }
  };

  const handleApplyScenario = (preset: ScenarioPreset) => {
    const updated = applyScenarioPreset(
      `demo:${activeBranch}:${endpoint.slug}`,
      "demo",
      activeBranch,
      endpoint.slug,
      preset
    );
    saveRecordsToStore(updated);
  };

  const handleDuplicateRecord = (index: number) => {
    const target = records[index];
    if (!target) return;

    const copy = JSON.parse(JSON.stringify(target));
    copy.id = `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    if (copy.name) copy.name = `${copy.name} (Copy)`;

    saveRecordsToStore([copy, ...records]);
  };

  const handleDeleteRecord = (index: number) => {
    saveRecordsToStore(records.filter((_, i) => i !== index));
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditJsonText(JSON.stringify(records[index], null, 2));
    setJsonError(null);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    try {
      const parsed = JSON.parse(editJsonText);
      const updated = [...records];
      updated[editingIndex] = parsed;
      saveRecordsToStore(updated);
      setEditingIndex(null);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-mb-bg border-l border-mb-border w-full max-w-2xl h-full flex flex-col shadow-mb-md">
        {/* Drawer Header */}
        <div className="p-5 border-b border-mb-border flex items-center justify-between bg-mb-surface">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-mb-bg-raised border border-mb-border flex items-center justify-center">
              <Database className="w-4 h-4 text-mb-text" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-mb-text tracking-tight flex items-center gap-2">
                <span>{endpoint.name} Store</span>
                <span className="font-mono text-2xs text-mb-text-tertiary">({records.length} items)</span>
              </h2>
              <p className="text-2xs text-mb-text-tertiary font-mono">/api/v1/demo/{endpoint.slug}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-mb-surface-hover text-mb-text-tertiary hover:text-mb-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Branch & Sub-Header Controls */}
        <div className="px-5 py-3 border-b border-mb-border bg-mb-bg-raised flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Branch Switcher */}
          <div className="flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5 text-mb-text-tertiary" />
            <span className="text-2xs text-mb-text-tertiary">Branch:</span>
            <select
              value={activeBranch}
              onChange={(e) => setActiveBranch(e.target.value)}
              className="bg-mb-surface border border-mb-border rounded px-2 py-1 text-2xs text-mb-text font-mono"
            >
              <option value="main">main</option>
              <option value="feature-auth">feature-auth</option>
              <option value="pr-104">pr-104</option>
              <option value="qa-staging">qa-staging</option>
            </select>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 bg-mb-surface p-1 rounded border border-mb-border">
            <button
              onClick={() => setActiveTab("records")}
              className={`px-2.5 py-1 rounded text-2xs font-medium transition-colors ${
                activeTab === "records"
                  ? "bg-mb-surface-active text-mb-text"
                  : "text-mb-text-tertiary hover:text-mb-text"
              }`}
            >
              Records
            </button>

            <button
              onClick={() => setActiveTab("snapshots")}
              className={`px-2.5 py-1 rounded text-2xs font-medium transition-colors ${
                activeTab === "snapshots"
                  ? "bg-mb-surface-active text-mb-text"
                  : "text-mb-text-tertiary hover:text-mb-text"
              }`}
            >
              Snapshots ({snapshots.length})
            </button>

            <button
              onClick={() => setActiveTab("scenarios")}
              className={`px-2.5 py-1 rounded text-2xs font-medium transition-colors ${
                activeTab === "scenarios"
                  ? "bg-mb-surface-active text-mb-text"
                  : "text-mb-text-tertiary hover:text-mb-text"
              }`}
            >
              Scenarios ({scenarios.length})
            </button>
          </div>
        </div>

        {/* TAB 1: LIVE RECORDS */}
        {activeTab === "records" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search & Actions Bar */}
            <div className="p-4 border-b border-mb-border flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-mb-text-tertiary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter store records by property or value..."
                  className="w-full bg-mb-bg-raised border border-mb-border rounded px-3 py-1.5 pl-8 text-xs text-mb-text focus:outline-none"
                />
              </div>

              <button
                onClick={handleResetStore}
                className="mb-btn-secondary inline-flex h-8 items-center px-2.5 text-2xs"
                title="Reset store data back to clean seed values"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                <span>Reset</span>
              </button>
            </div>

            {/* Records List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredRecords.map((rec, idx) => {
                const isEditing = editingIndex === idx;
                const recordId = rec.id || rec.uuid || `rec-${idx}`;
                const foreignKeys = Object.keys(rec).filter(
                  (k) => k.endsWith("_id") || k === "user_id" || k === "customer_id"
                );

                return (
                  <div key={idx} className="mb-panel p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-mb-border pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-2xs text-mb-text-disabled">#{idx + 1}</span>
                        <span className="font-mono text-xs text-mb-text font-semibold">{String(recordId)}</span>
                        {foreignKeys.map((fk) => (
                          <span
                            key={fk}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-mb-bg-raised text-mb-text-tertiary border border-mb-border text-2xs font-mono"
                          >
                            <LinkIcon className="w-2.5 h-2.5" />
                            <span>{fk}: {String(rec[fk])}</span>
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        {!isEditing ? (
                          <>
                            <button
                              onClick={() => startEditing(idx)}
                              className="p-1 rounded text-mb-text-tertiary hover:text-mb-text hover:bg-mb-surface-hover transition-colors"
                              title="Edit JSON record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateRecord(idx)}
                              className="p-1 rounded text-mb-text-tertiary hover:text-mb-text hover:bg-mb-surface-hover transition-colors"
                              title="Duplicate record"
                            >
                              <Code2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(idx)}
                              className="p-1 rounded text-mb-text-tertiary hover:text-mb-error hover:bg-mb-surface-hover transition-colors"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="p-1 rounded text-mb-text-tertiary hover:text-mb-text hover:bg-mb-surface-hover transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editJsonText}
                          onChange={(e) => setEditJsonText(e.target.value)}
                          rows={8}
                          className="w-full bg-mb-bg-raised border border-mb-border rounded p-3 font-mono text-xs text-mb-text focus:outline-none"
                        />
                        {jsonError && <p className="text-2xs text-mb-error font-mono">{jsonError}</p>}
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="mb-btn-secondary inline-flex h-7 items-center px-2.5 text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveEdit}
                            className="mb-btn-primary inline-flex h-7 items-center px-2.5 text-xs"
                          >
                            <Check className="w-3 h-3 mr-1" /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <pre className="text-xs font-mono text-mb-text-secondary overflow-x-auto">
                        <code>{JSON.stringify(rec, null, 2)}</code>
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: STATE SNAPSHOTS */}
        {activeTab === "snapshots" && (
          <div className="flex-1 p-5 space-y-4 overflow-y-auto">
            <div className="mb-panel p-4 space-y-3">
              <h3 className="text-xs font-semibold text-mb-text flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Save Git-Style State Snapshot</span>
              </h3>
              <p className="text-2xs text-mb-text-tertiary">
                Capture the entire endpoint store state on branch <code className="font-mono text-mb-text">{activeBranch}</code> for instant restoration.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSnapshotName}
                  onChange={(e) => setNewSnapshotName(e.target.value)}
                  placeholder="e.g. pre-checkout-checkpoint"
                  className="flex-1 bg-mb-bg-raised border border-mb-border rounded px-3 py-1.5 text-xs text-mb-text focus:outline-none"
                />
                <button
                  onClick={handleCreateSnapshot}
                  className="mb-btn-primary inline-flex h-8 items-center px-3 text-xs"
                >
                  Save Snapshot
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xs font-semibold text-mb-text-tertiary uppercase tracking-wider">
                Saved Snapshots ({snapshots.length})
              </h3>
              {snapshots.length === 0 ? (
                <div className="text-center py-8 mb-panel text-2xs text-mb-text-disabled">
                  No snapshots created yet.
                </div>
              ) : (
                snapshots.map((snap) => (
                  <div key={snap.id} className="mb-panel p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-mb-text">{snap.name}</h4>
                      <p className="text-2xs text-mb-text-tertiary font-mono">
                        Branch: {snap.branch} · Created: {new Date(snap.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRestoreSnapshot(snap.id)}
                      className="mb-btn-secondary inline-flex h-7 items-center px-2.5 text-xs"
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SCENARIO PRESETS */}
        {activeTab === "scenarios" && (
          <div className="flex-1 p-5 space-y-4 overflow-y-auto">
            <div className="space-y-3">
              <h3 className="text-2xs font-semibold text-mb-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Available Scenario Presets</span>
              </h3>
              {scenarios.map((scen) => (
                <div key={scen.id} className="mb-panel p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-mb-text">{scen.name}</h4>
                    <p className="text-2xs text-mb-text-tertiary mt-0.5">{scen.description || "Preset dataset state"}</p>
                    <span className="font-mono text-2xs text-mb-text-disabled">({scen.records.length} records)</span>
                  </div>
                  <button
                    onClick={() => handleApplyScenario(scen)}
                    className="mb-btn-primary inline-flex h-7 items-center px-3 text-xs"
                  >
                    Apply Scenario
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
