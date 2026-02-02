-- Create table to store emails that should become gestors
CREATE TABLE public.gestor_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gestor_emails ENABLE ROW LEVEL SECURITY;

-- Only gestors can manage this table
CREATE POLICY "Gestors can view gestor_emails"
ON public.gestor_emails
FOR SELECT
USING (has_role(auth.uid(), 'gestor'));

CREATE POLICY "Gestors can insert gestor_emails"
ON public.gestor_emails
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'gestor'));

CREATE POLICY "Gestors can delete gestor_emails"
ON public.gestor_emails
FOR DELETE
USING (has_role(auth.uid(), 'gestor'));

-- Update the handle_new_user function to check gestor_emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_first_user BOOLEAN;
  employee_exists BOOLEAN;
  is_gestor_email BOOLEAN;
BEGIN
  -- Check if this is the first user (will be gestor)
  SELECT COUNT(*) = 0 INTO is_first_user FROM public.profiles;
  
  -- Insert profile
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  -- Check if email is in gestor_emails list
  SELECT EXISTS(SELECT 1 FROM public.gestor_emails WHERE email = NEW.email) INTO is_gestor_email;
  
  -- Check if employee with this email exists
  SELECT EXISTS(SELECT 1 FROM public.employees WHERE email = NEW.email) INTO employee_exists;
  
  -- If first user OR email is in gestor_emails, make them a gestor
  IF is_first_user OR is_gestor_email THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'gestor');
  ELSIF employee_exists THEN
    -- If employee exists with same email, make them colaborador
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'colaborador');
  END IF;
  
  -- Create default config if not exists
  INSERT INTO public.config (id) 
  SELECT gen_random_uuid() 
  WHERE NOT EXISTS (SELECT 1 FROM public.config);
  
  RETURN NEW;
END;
$function$;