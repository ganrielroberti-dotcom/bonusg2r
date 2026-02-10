
-- Auvo Integration Tables

-- 1. auvo_user_mapping: maps Auvo users to app employees
CREATE TABLE public.auvo_user_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auvo_user_id integer NOT NULL,
  auvo_user_name text NOT NULL DEFAULT '',
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(auvo_user_id),
  UNIQUE(employee_id)
);
ALTER TABLE public.auvo_user_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestors can manage auvo_user_mapping" ON public.auvo_user_mapping FOR ALL USING (has_role(auth.uid(), 'gestor'::app_role));

-- 2. auvo_sync_log: tracks sync executions
CREATE TABLE public.auvo_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  employees_count integer NOT NULL DEFAULT 0,
  tasks_count integer NOT NULL DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'running'
);
ALTER TABLE public.auvo_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestors can manage auvo_sync_log" ON public.auvo_sync_log FOR ALL USING (has_role(auth.uid(), 'gestor'::app_role));
CREATE POLICY "Service can insert auvo_sync_log" ON public.auvo_sync_log FOR INSERT WITH CHECK (true);

-- 3. auvo_hours_cache: cached hours calculation per employee/month
CREATE TABLE public.auvo_hours_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key text NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  auvo_user_id integer NOT NULL,
  total_hours numeric NOT NULL DEFAULT 0,
  tasks_detail jsonb DEFAULT '[]'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(month_key, employee_id)
);
ALTER TABLE public.auvo_hours_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestors can manage auvo_hours_cache" ON public.auvo_hours_cache FOR ALL USING (has_role(auth.uid(), 'gestor'::app_role));
CREATE POLICY "Service can upsert auvo_hours_cache" ON public.auvo_hours_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update auvo_hours_cache" ON public.auvo_hours_cache FOR UPDATE USING (true);

-- 4. auvo_task_cache: cached Auvo task data for OS lookup
CREATE TABLE public.auvo_task_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auvo_task_id integer NOT NULL,
  os_number text NOT NULL DEFAULT '',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  cached_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(auvo_task_id)
);
ALTER TABLE public.auvo_task_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestors can manage auvo_task_cache" ON public.auvo_task_cache FOR ALL USING (has_role(auth.uid(), 'gestor'::app_role));
CREATE POLICY "Service can upsert auvo_task_cache" ON public.auvo_task_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update auvo_task_cache" ON public.auvo_task_cache FOR UPDATE USING (true);
