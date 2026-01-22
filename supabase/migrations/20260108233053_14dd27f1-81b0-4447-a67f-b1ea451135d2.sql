-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'monitor');

-- Enum para turnos
CREATE TYPE public.turno_type AS ENUM ('matutino', 'vespertino');

-- Enum para tipo de anotação
CREATE TYPE public.anotacao_tipo AS ENUM ('leve', 'media', 'grave', 'gravissima');

-- Enum para tipo de elogio
CREATE TYPE public.elogio_tipo AS ENUM ('coletivo', 'individual', 'mencao_honrosa');

-- Enum para tipo de termo
CREATE TYPE public.termo_tipo AS ENUM ('leve', 'medio', 'grave', 'gravissimo');

-- Tabela de perfis de usuários (monitores)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de roles de usuários
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Tabela de turmas
CREATE TABLE public.turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ano_letivo INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nome, ano_letivo)
);

-- Tabela de alunos
CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  cpf TEXT UNIQUE,
  ano_entrada INTEGER NOT NULL,
  turma_id UUID REFERENCES public.turmas(id),
  turno turno_type NOT NULL DEFAULT 'matutino',
  nota_disciplinar DECIMAL(4,2) DEFAULT 8.00,
  arquivado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de anotações
CREATE TABLE public.anotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
  tipo anotacao_tipo NOT NULL,
  descricao TEXT NOT NULL,
  lancado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de elogios
CREATE TABLE public.elogios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
  tipo elogio_tipo NOT NULL,
  descricao TEXT,
  lancado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de termos aplicados
CREATE TABLE public.termos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
  tipo termo_tipo NOT NULL,
  valor_desconto DECIMAL(4,2) NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de agenda
CREATE TABLE public.agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_evento DATE NOT NULL,
  tipo TEXT DEFAULT 'geral',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elogios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

-- Função para verificar role
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

-- Função para verificar se é autenticado
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- Políticas para profiles
CREATE POLICY "Profiles são visíveis para autenticados" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem atualizar próprio perfil" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins podem criar profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (true);

-- Políticas para user_roles
CREATE POLICY "Roles são visíveis para autenticados" ON public.user_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins podem gerenciar roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para turmas
CREATE POLICY "Turmas são visíveis para autenticados" ON public.turmas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados podem gerenciar turmas" ON public.turmas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para alunos
CREATE POLICY "Alunos são visíveis para autenticados" ON public.alunos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados podem gerenciar alunos" ON public.alunos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para anotacoes
CREATE POLICY "Anotações são visíveis para autenticados" ON public.anotacoes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados podem criar anotações" ON public.anotacoes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados podem deletar anotações" ON public.anotacoes
  FOR DELETE TO authenticated USING (true);

-- Políticas para elogios
CREATE POLICY "Elogios são visíveis para autenticados" ON public.elogios
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados podem criar elogios" ON public.elogios
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados podem deletar elogios" ON public.elogios
  FOR DELETE TO authenticated USING (true);

-- Políticas para termos
CREATE POLICY "Termos são visíveis para autenticados" ON public.termos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados podem criar termos" ON public.termos
  FOR INSERT TO authenticated WITH CHECK (true);

-- Políticas para agenda
CREATE POLICY "Agenda é visível para autenticados" ON public.agenda
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados podem gerenciar agenda" ON public.agenda
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_alunos_updated_at
  BEFORE UPDATE ON public.alunos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();