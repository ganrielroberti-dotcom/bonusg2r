-- Remove overly permissive policies that are bypassed by service_role anyway

-- audit_log: remove open INSERT (trigger uses SECURITY DEFINER, bypasses RLS)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;

-- auvo_hours_cache: remove open INSERT and UPDATE
DROP POLICY IF EXISTS "Service can upsert auvo_hours_cache" ON public.auvo_hours_cache;
DROP POLICY IF EXISTS "Service can update auvo_hours_cache" ON public.auvo_hours_cache;

-- auvo_task_cache: remove open INSERT and UPDATE  
DROP POLICY IF EXISTS "Service can upsert auvo_task_cache" ON public.auvo_task_cache;
DROP POLICY IF EXISTS "Service can update auvo_task_cache" ON public.auvo_task_cache;

-- auvo_sync_log: remove open INSERT
DROP POLICY IF EXISTS "Service can insert auvo_sync_log" ON public.auvo_sync_log;