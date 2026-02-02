-- Create audit_log table for tracking all changes
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_by_email TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create index for fast queries
CREATE INDEX idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_record_id ON public.audit_log(record_id);
CREATE INDEX idx_audit_log_changed_at ON public.audit_log(changed_at DESC);
CREATE INDEX idx_audit_log_changed_by ON public.audit_log(changed_by);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only gestors can view audit logs
CREATE POLICY "Gestors can view audit logs"
ON public.audit_log
FOR SELECT
USING (has_role(auth.uid(), 'gestor'::app_role));

-- System can insert audit logs (via trigger or edge function)
CREATE POLICY "System can insert audit logs"
ON public.audit_log
FOR INSERT
WITH CHECK (true);

-- Create function to log changes automatically
CREATE OR REPLACE FUNCTION public.log_audit_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  record_id UUID;
  old_data JSONB;
  new_data JSONB;
  user_email TEXT;
BEGIN
  -- Get the record ID
  IF TG_OP = 'DELETE' THEN
    record_id := OLD.id;
    old_data := to_jsonb(OLD);
    new_data := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    record_id := NEW.id;
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSE -- INSERT
    record_id := NEW.id;
    old_data := NULL;
    new_data := to_jsonb(NEW);
  END IF;

  -- Get user email if authenticated
  SELECT email INTO user_email
  FROM public.profiles
  WHERE id = auth.uid();

  -- Insert audit log entry
  INSERT INTO public.audit_log (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_by,
    changed_by_email
  ) VALUES (
    TG_TABLE_NAME,
    record_id,
    TG_OP,
    old_data,
    new_data,
    auth.uid(),
    user_email
  );

  -- Return appropriate value
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for audited tables
CREATE TRIGGER audit_os_records
  AFTER INSERT OR UPDATE OR DELETE ON public.os_records
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE TRIGGER audit_employees
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE TRIGGER audit_config
  AFTER INSERT OR UPDATE ON public.config
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE TRIGGER audit_horas_trabalhadas
  AFTER INSERT OR UPDATE OR DELETE ON public.horas_trabalhadas
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();