-- ─────────────────────────────────────────────────────────────
-- Mockbit Database Schema
-- Run this migration in your Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own projects"
  ON public.projects FOR ALL
  USING (auth.uid() = user_id);

-- 2. Endpoints Table
CREATE TABLE IF NOT EXISTS public.endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  response_type TEXT NOT NULL DEFAULT 'object', -- 'object' | 'array'
  array_length INT NOT NULL DEFAULT 10,
  status_code INT NOT NULL DEFAULT 200,
  latency_ms INT NOT NULL DEFAULT 0,
  schema_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_randomized BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- Index for ultra-fast mock endpoint lookup: /api/{user}/{slug}
CREATE INDEX IF NOT EXISTS idx_endpoints_user_slug ON public.endpoints(user_id, slug);

-- Enable RLS for Endpoints
ALTER TABLE public.endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own endpoints"
  ON public.endpoints FOR ALL
  USING (auth.uid() = user_id);

-- 3. Request Logs Table (Lean & Capped)
CREATE TABLE IF NOT EXISTS public.request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES public.endpoints(id) ON DELETE CASCADE,
  method TEXT NOT NULL DEFAULT 'GET',
  status_code INT NOT NULL DEFAULT 200,
  ip_hash TEXT,
  execution_ms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_request_logs_endpoint_created 
  ON public.request_logs(endpoint_id, created_at DESC);

-- Enable RLS for Request Logs
ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for their endpoints"
  ON public.request_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.endpoints 
      WHERE endpoints.id = request_logs.endpoint_id 
      AND endpoints.user_id = auth.uid()
    )
  );

-- Auto-trim trigger: High-performance buffer cleanup
-- Only executes DELETE when log count exceeds 110 (batches deletions every 10 inserts)
CREATE OR REPLACE FUNCTION trim_endpoint_request_logs()
RETURNS TRIGGER AS $$
DECLARE
  log_count INT;
BEGIN
  SELECT count(*) INTO log_count
  FROM public.request_logs
  WHERE endpoint_id = NEW.endpoint_id;

  IF log_count > 110 THEN
    DELETE FROM public.request_logs
    WHERE endpoint_id = NEW.endpoint_id
      AND id NOT IN (
        SELECT id FROM public.request_logs
        WHERE endpoint_id = NEW.endpoint_id
        ORDER BY created_at DESC
        LIMIT 100
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_trim_request_logs ON public.request_logs;
CREATE TRIGGER trigger_trim_request_logs
AFTER INSERT ON public.request_logs
FOR EACH ROW EXECUTE FUNCTION trim_endpoint_request_logs();
