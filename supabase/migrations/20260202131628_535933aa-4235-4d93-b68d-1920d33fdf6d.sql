-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('gestor', 'colaborador');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'colaborador',
  UNIQUE (user_id, role)
);

-- Create employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Técnico',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create config table
CREATE TABLE public.config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bonus_cap NUMERIC NOT NULL DEFAULT 600,
  max_pts INTEGER NOT NULL DEFAULT 16,
  horas_esperadas INTEGER NOT NULL DEFAULT 220,
  layer_weights JSONB NOT NULL DEFAULT '{"esforco": 0.5, "qualidade": 0.4, "superacao": 0.1}'::jsonb,
  duration_weights JSONB NOT NULL DEFAULT '[{"id":"short","label":"Curta","mult":0.8},{"id":"normal","label":"Normal","mult":1.0},{"id":"long","label":"Longa","mult":1.3}]'::jsonb,
  difficulty_weights JSONB NOT NULL DEFAULT '[{"id":"easy","label":"Fácil","ce":0.5,"desc":"Simples"},{"id":"medium","label":"Média","ce":1.0,"desc":"Padrão"},{"id":"hard","label":"Difícil","ce":1.5,"desc":"Complexa"},{"id":"expert","label":"Expert","ce":2.0,"desc":"Especializada"}]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create horas_trabalhadas table
CREATE TABLE public.horas_trabalhadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key TEXT NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  horas NUMERIC NOT NULL DEFAULT 0,
  UNIQUE (month_key, employee_id)
);

-- Create os_records table
CREATE TABLE public.os_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  employee_name TEXT NOT NULL,
  employee_role TEXT NOT NULL,
  month_key TEXT NOT NULL,
  date TEXT NOT NULL,
  os_id TEXT NOT NULL,
  cliente TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Serviço',
  dificuldade_id TEXT NOT NULL,
  duracao_id TEXT NOT NULL,
  duracao_mult NUMERIC NOT NULL DEFAULT 1.0,
  valor_os NUMERIC NOT NULL DEFAULT 0,
  setor TEXT NOT NULL DEFAULT '',
  obs TEXT NOT NULL DEFAULT '',
  crit JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER NOT NULL DEFAULT 0,
  ce NUMERIC NOT NULL DEFAULT 0,
  ce_final NUMERIC NOT NULL DEFAULT 0,
  ce_q NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horas_trabalhadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_records ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get employee_id by user email
CREATE OR REPLACE FUNCTION public.get_employee_id_by_email(_email TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employees WHERE email = _email LIMIT 1
$$;

-- Create function to get current user's employee_id
CREATE OR REPLACE FUNCTION public.get_current_employee_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id 
  FROM public.employees e
  JOIN public.profiles p ON e.email = p.email
  WHERE p.id = auth.uid()
  LIMIT 1
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Gestors can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Gestors can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Gestors can update roles" ON public.user_roles
  FOR UPDATE USING (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Gestors can delete roles" ON public.user_roles
  FOR DELETE USING (public.has_role(auth.uid(), 'gestor'));

-- RLS Policies for employees
CREATE POLICY "Gestors can do everything with employees" ON public.employees
  FOR ALL USING (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Colaboradores can view their own employee record" ON public.employees
  FOR SELECT USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- RLS Policies for config
CREATE POLICY "Authenticated users can read config" ON public.config
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Gestors can update config" ON public.config
  FOR UPDATE USING (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Gestors can insert config" ON public.config
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'gestor'));

-- RLS Policies for horas_trabalhadas
CREATE POLICY "Gestors can do everything with horas" ON public.horas_trabalhadas
  FOR ALL USING (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Colaboradores can view their own horas" ON public.horas_trabalhadas
  FOR SELECT USING (
    employee_id = public.get_current_employee_id()
  );

-- RLS Policies for os_records
CREATE POLICY "Gestors can do everything with os" ON public.os_records
  FOR ALL USING (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Colaboradores can view their own os" ON public.os_records
  FOR SELECT USING (
    employee_id = public.get_current_employee_id()
  );

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_config_updated_at
  BEFORE UPDATE ON public.config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_os_records_updated_at
  BEFORE UPDATE ON public.os_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first_user BOOLEAN;
  employee_exists BOOLEAN;
BEGIN
  -- Check if this is the first user (will be gestor)
  SELECT COUNT(*) = 0 INTO is_first_user FROM public.profiles;
  
  -- Insert profile
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  -- Check if employee with this email exists
  SELECT EXISTS(SELECT 1 FROM public.employees WHERE email = NEW.email) INTO employee_exists;
  
  -- If first user, make them a gestor
  IF is_first_user THEN
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
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_os_records_employee_id ON public.os_records(employee_id);
CREATE INDEX idx_os_records_month_key ON public.os_records(month_key);
CREATE INDEX idx_horas_trabalhadas_month_key ON public.horas_trabalhadas(month_key);
CREATE INDEX idx_employees_email ON public.employees(email);