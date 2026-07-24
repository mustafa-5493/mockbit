"use client";

import { useState } from "react";
import { parseSqlDdlToSchemas, IntrospectionResult, ParsedTableSchema } from "@/lib/schema-introspector";
import { Database, FileCode, Layers, GitFork, AlertTriangle, Check, X, ShieldAlert, ArrowRight, Play } from "lucide-react";

interface DbSchemaImportModalProps {
  onImportSchemas: (schemas: ParsedTableSchema[], mode: "replace" | "merge") => void;
  onClose: () => void;
  existingStudioSlug?: string;
}

const SAMPLE_POSTGRES_DDL = `-- PostgreSQL E-Commerce Dump (with ALTER TABLE FKs)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    user_role VARCHAR(50) DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL
);

-- Separate ALTER TABLE Foreign Keys (pg_dump standard)
ALTER TABLE orders ADD CONSTRAINT fk_orders_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE order_items ADD CONSTRAINT fk_items_order 
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE order_items ADD CONSTRAINT fk_items_product 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
`;

const SAMPLE_SAAS_DDL = `-- SaaS Multi-Tenant Database DDL
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    subscription_plan VARCHAR(50) DEFAULT 'pro',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'member'
);

ALTER TABLE users ADD CONSTRAINT fk_user_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
`;

export function DbSchemaImportModal({ onImportSchemas, onClose, existingStudioSlug }: DbSchemaImportModalProps) {
  const [sqlText, setSqlText] = useState<string>(SAMPLE_POSTGRES_DDL);
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
  const [introspection, setIntrospection] = useState<IntrospectionResult | null>(null);

  const handleParse = () => {
    if (!sqlText.trim()) return;
    const initialSlugs = new Set<string>();
    if (existingStudioSlug) initialSlugs.add(existingStudioSlug.toLowerCase());
    const res = parseSqlDdlToSchemas(sqlText, initialSlugs);
    setIntrospection(res);
  };

  const handleConfirmImport = () => {
    if (!introspection || introspection.tables.length === 0) return;
    onImportSchemas(introspection.tables, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-mb-bg border border-mb-border rounded-lg max-w-4xl w-full flex flex-col max-h-[90vh] shadow-mb-md overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-mb-border bg-mb-surface flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-mb-bg-raised border border-mb-border flex items-center justify-center">
              <Database className="w-4 h-4 text-mb-text" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-mb-text">Mockbit Twin Phase 0 — SQL DDL Schema Introspector</h3>
              <p className="text-2xs text-mb-text-tertiary">Zero-risk 0-row SQL introspection parser (PostgreSQL, MySQL, SQLite DDL dumps)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-mb-surface-hover text-mb-text-tertiary hover:text-mb-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Sample Presets Bar */}
        <div className="px-5 py-3 border-b border-mb-border bg-mb-bg-raised flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xs font-mono text-mb-text-tertiary">Load Sample SQL DDL:</span>
            <button
              onClick={() => {
                setSqlText(SAMPLE_POSTGRES_DDL);
                setIntrospection(null);
              }}
              className="mb-btn-secondary h-7 px-2.5 text-2xs"
            >
              PostgreSQL E-Commerce Dump
            </button>
            <button
              onClick={() => {
                setSqlText(SAMPLE_SAAS_DDL);
                setIntrospection(null);
              }}
              className="mb-btn-secondary h-7 px-2.5 text-2xs"
            >
              SaaS Multi-Tenant DB
            </button>
          </div>

          <button onClick={handleParse} className="mb-btn-primary inline-flex h-8 items-center px-3 text-xs">
            <Play className="w-3.5 h-3.5 mr-1.5" />
            <span>Parse DDL Schema</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 bg-mb-bg">
          {/* Textarea Input */}
          <div className="space-y-1.5">
            <label className="block text-2xs font-medium text-mb-text-tertiary flex items-center justify-between">
              <span>Paste DDL Schema Text (CREATE TABLE & ALTER TABLE statements):</span>
              <span className="font-mono text-mb-text-disabled">0 Rows Read · 100% Safe</span>
            </label>
            <textarea
              value={sqlText}
              onChange={(e) => {
                setSqlText(e.target.value);
                setIntrospection(null);
              }}
              rows={10}
              placeholder="CREATE TABLE users (id UUID PRIMARY KEY, name VARCHAR(100)...);"
              className="w-full bg-mb-bg-raised border border-mb-border rounded-md p-3 font-mono text-2xs text-mb-text focus:outline-none focus:border-mb-border-focus leading-relaxed"
            />
          </div>

          {/* Introspection Parsing Results */}
          {introspection && (
            <div className="space-y-4 p-4 rounded-md border border-mb-border bg-mb-surface">
              <div className="flex items-center justify-between border-b border-mb-border pb-3">
                <span className="text-xs font-semibold text-mb-text flex items-center gap-2">
                  <Check className="w-4 h-4 text-mb-success" />
                  <span>DDL Schema Introspection Summary</span>
                </span>
                <span className="text-2xs font-mono text-mb-success">Parsed Successfully</span>
              </div>

              {/* Stats Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs font-mono">
                <div className="p-2.5 rounded bg-mb-bg-raised border border-mb-border">
                  <span className="text-mb-text-tertiary block">Tables Detected</span>
                  <span className="text-mb-text font-semibold text-sm">{introspection.summary.tablesCount}</span>
                </div>
                <div className="p-2.5 rounded bg-mb-bg-raised border border-mb-border">
                  <span className="text-mb-text-tertiary block">Foreign Keys</span>
                  <span className="text-mb-text font-semibold text-sm">{introspection.summary.relationsCount}</span>
                </div>
                <div className="p-2.5 rounded bg-mb-bg-raised border border-mb-border">
                  <span className="text-mb-text-tertiary block">Junction Tables</span>
                  <span className="text-mb-text font-semibold text-sm">{introspection.summary.junctionTablesCount}</span>
                </div>
                <div className="p-2.5 rounded bg-mb-bg-raised border border-mb-border">
                  <span className="text-mb-text-tertiary block">Skipped Views/Indexes</span>
                  <span className="text-mb-text font-semibold text-sm">
                    {introspection.summary.skippedViewsCount + introspection.summary.skippedIndexesCount}
                  </span>
                </div>
              </div>

              {/* Warnings List */}
              {introspection.summary.warnings.length > 0 && (
                <div className="p-3 rounded bg-mb-bg-raised border border-mb-border font-mono text-2xs space-y-1">
                  <span className="text-mb-warning font-semibold block flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Parser Notifications:</span>
                  </span>
                  {introspection.summary.warnings.map((w, idx) => (
                    <p key={idx} className="text-mb-text-tertiary">• {w}</p>
                  ))}
                </div>
              )}

              {/* Parsed Tables List */}
              <div className="space-y-2">
                <span className="text-2xs font-mono text-mb-text-tertiary block">Parsed Table Schemas & Inferred Types:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                  {introspection.tables.map((t) => (
                    <div key={t.tableName} className="p-3 rounded bg-mb-bg-raised border border-mb-border space-y-1 font-mono text-2xs">
                      <div className="flex items-center justify-between font-semibold text-mb-text">
                        <span>{t.tableName}</span>
                        <span className="text-mb-text-tertiary">/api/v1/demo/{t.slug}</span>
                      </div>
                      <div className="text-mb-text-tertiary">
                        Fields ({t.fields.length}): {t.fields.map((f) => f.name).slice(0, 4).join(", ")}...
                      </div>
                      {t.relations.length > 0 && (
                        <div className="text-mb-success text-[11px]">
                          Relations ({t.relations.length}): {t.relations.map((r) => `${r.foreignKey}➔${r.targetEndpoint}`).join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Import Mode Selector */}
              <div className="pt-3 border-t border-mb-border flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="text-2xs font-mono text-mb-text-tertiary">Import Action Mode:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === "replace"}
                      onChange={() => setImportMode("replace")}
                      className="accent-mb-text"
                    />
                    <span>Replace Current Draft</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === "merge"}
                      onChange={() => setImportMode("merge")}
                      className="accent-mb-text"
                    />
                    <span>Merge Alongside Draft</span>
                  </label>
                </div>

                <button onClick={handleConfirmImport} className="mb-btn-primary inline-flex h-8 items-center px-4 text-xs">
                  <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                  <span>Generate Mock API Schemas ({introspection.tables.length} tables)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
