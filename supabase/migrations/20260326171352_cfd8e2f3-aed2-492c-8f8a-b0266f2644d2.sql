
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'user');

-- Create condominios table
CREATE TABLE public.condominios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  total_vagas INTEGER NOT NULL DEFAULT 0,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create usuarios table
CREATE TABLE public.usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  cpf TEXT,
  unidade TEXT,
  placa TEXT,
  role app_role NOT NULL DEFAULT 'user',
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create vagas table
CREATE TABLE public.vagas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identificacao TEXT NOT NULL,
  bloco TEXT,
  unidade TEXT,
  owner_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create disponibilidades_vaga table
CREATE TABLE public.disponibilidades_vaga (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vaga_id UUID NOT NULL REFERENCES public.vagas(id) ON DELETE CASCADE,
  inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  fim TIMESTAMP WITH TIME ZONE NOT NULL,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  criado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_duration CHECK (fim > inicio),
  CONSTRAINT check_min_duration CHECK (fim - inicio >= INTERVAL '1 hour')
);

-- Create reservas table
CREATE TABLE public.reservas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vaga_id UUID NOT NULL REFERENCES public.vagas(id) ON DELETE CASCADE,
  disponibilidade_id UUID REFERENCES public.disponibilidades_vaga(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  fim TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmada' CHECK (status IN ('confirmada', 'em_uso', 'concluida', 'cancelada')),
  codigo_acesso TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create logs_auditoria table
CREATE TABLE public.logs_auditoria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  entidade TEXT,
  entidade_id UUID,
  detalhes JSONB,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disponibilidades_vaga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: get usuario_id from auth
CREATE OR REPLACE FUNCTION public.get_usuario_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid()
$$;

-- Helper: get condominio_id from auth user
CREATE OR REPLACE FUNCTION public.get_user_condominio_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT condominio_id FROM public.usuarios WHERE auth_user_id = auth.uid()
$$;

-- RLS Policies for condominios
CREATE POLICY "Users can view their condominio" ON public.condominios
  FOR SELECT TO authenticated
  USING (id = public.get_user_condominio_id() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert condominios" ON public.condominios
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update condominios" ON public.condominios
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete condominios" ON public.condominios
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for usuarios
CREATE POLICY "Users can view users in their condominio" ON public.usuarios
  FOR SELECT TO authenticated
  USING (condominio_id = public.get_user_condominio_id() OR auth_user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can insert users" ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete users" ON public.usuarios
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for vagas
CREATE POLICY "Users can view vagas in their condominio" ON public.vagas
  FOR SELECT TO authenticated
  USING (condominio_id = public.get_user_condominio_id());

CREATE POLICY "Admins can insert vagas" ON public.vagas
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update vagas" ON public.vagas
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vagas" ON public.vagas
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for disponibilidades_vaga
CREATE POLICY "Users can view disponibilidades in their condominio" ON public.disponibilidades_vaga
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vagas v
      WHERE v.id = vaga_id AND v.condominio_id = public.get_user_condominio_id()
    )
  );

CREATE POLICY "Owners can create disponibilidades for their vagas" ON public.disponibilidades_vaga
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vagas v
      WHERE v.id = vaga_id AND v.owner_id = public.get_usuario_id() AND v.ativo = true
    )
  );

CREATE POLICY "Owners can update their disponibilidades" ON public.disponibilidades_vaga
  FOR UPDATE TO authenticated
  USING (criado_por = public.get_usuario_id());

CREATE POLICY "Owners can delete their disponibilidades" ON public.disponibilidades_vaga
  FOR DELETE TO authenticated
  USING (criado_por = public.get_usuario_id());

-- RLS Policies for reservas
CREATE POLICY "Users can view their reservas" ON public.reservas
  FOR SELECT TO authenticated
  USING (
    user_id = public.get_usuario_id()
    OR EXISTS (
      SELECT 1 FROM public.vagas v WHERE v.id = vaga_id AND v.owner_id = public.get_usuario_id()
    )
  );

CREATE POLICY "Users can create reservas" ON public.reservas
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.get_usuario_id());

CREATE POLICY "Users can update their reservas" ON public.reservas
  FOR UPDATE TO authenticated
  USING (user_id = public.get_usuario_id());

-- RLS Policies for logs_auditoria
CREATE POLICY "Admins can view logs" ON public.logs_auditoria
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR user_id = public.get_usuario_id());

CREATE POLICY "System can insert logs" ON public.logs_auditoria
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Views
CREATE OR REPLACE VIEW public.minhas_vagas AS
SELECT v.*, d.inicio AS disponivel_inicio, d.fim AS disponivel_fim, d.id AS disponibilidade_id
FROM public.vagas v
LEFT JOIN public.disponibilidades_vaga d ON d.vaga_id = v.id AND d.fim > now()
WHERE v.owner_id = public.get_usuario_id();

CREATE OR REPLACE VIEW public.vagas_disponiveis AS
SELECT v.id AS vaga_id, v.identificacao, v.bloco, v.unidade, v.condominio_id,
  d.id AS disponibilidade_id, d.inicio, d.fim,
  u.nome AS proprietario_nome
FROM public.vagas v
JOIN public.disponibilidades_vaga d ON d.vaga_id = v.id
LEFT JOIN public.usuarios u ON u.id = v.owner_id
WHERE v.ativo = true
  AND d.fim > now()
  AND d.inicio <= d.fim
  AND v.condominio_id = public.get_user_condominio_id()
  AND NOT EXISTS (
    SELECT 1 FROM public.reservas r
    WHERE r.vaga_id = v.id
      AND r.status IN ('confirmada', 'em_uso')
      AND r.inicio < d.fim AND r.fim > d.inicio
  );

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_condominios_updated_at BEFORE UPDATE ON public.condominios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vagas_updated_at BEFORE UPDATE ON public.vagas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reservas_updated_at BEFORE UPDATE ON public.reservas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit log trigger function
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.logs_auditoria (user_id, acao, entidade, entidade_id, detalhes)
  VALUES (
    public.get_usuario_id(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object('operation', TG_OP, 'table', TG_TABLE_NAME)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply audit triggers
CREATE TRIGGER audit_vagas AFTER INSERT OR UPDATE OR DELETE ON public.vagas FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER audit_disponibilidades AFTER INSERT OR UPDATE OR DELETE ON public.disponibilidades_vaga FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER audit_reservas AFTER INSERT OR UPDATE OR DELETE ON public.reservas FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Indexes
CREATE INDEX idx_usuarios_auth_user_id ON public.usuarios(auth_user_id);
CREATE INDEX idx_usuarios_condominio_id ON public.usuarios(condominio_id);
CREATE INDEX idx_vagas_condominio_id ON public.vagas(condominio_id);
CREATE INDEX idx_vagas_owner_id ON public.vagas(owner_id);
CREATE INDEX idx_disponibilidades_vaga_id ON public.disponibilidades_vaga(vaga_id);
CREATE INDEX idx_disponibilidades_periodo ON public.disponibilidades_vaga(inicio, fim);
CREATE INDEX idx_reservas_vaga_id ON public.reservas(vaga_id);
CREATE INDEX idx_reservas_user_id ON public.reservas(user_id);
CREATE INDEX idx_reservas_status ON public.reservas(status);
CREATE INDEX idx_logs_user_id ON public.logs_auditoria(user_id);
