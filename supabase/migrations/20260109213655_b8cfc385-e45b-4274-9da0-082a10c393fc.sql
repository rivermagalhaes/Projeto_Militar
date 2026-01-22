-- Adicionar campos para matrícula única e foto em alunos
ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS matricula TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS foto_url TEXT,
ADD COLUMN IF NOT EXISTS consentimento_lgpd BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consentimento_imagem BOOLEAN DEFAULT false;

-- Criar índice único para matrícula
CREATE UNIQUE INDEX IF NOT EXISTS idx_alunos_matricula ON public.alunos(matricula) WHERE matricula IS NOT NULL;

-- Adicionar campo de evidência/imagem na agenda
ALTER TABLE public.agenda
ADD COLUMN IF NOT EXISTS imagem_url TEXT;

-- Tabela para informativos/eventos do colégio
CREATE TABLE IF NOT EXISTS public.informativos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_evento DATE NOT NULL,
  imagem_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.informativos ENABLE ROW LEVEL SECURITY;

-- Políticas para informativos
CREATE POLICY "Authenticated read informativos"
ON public.informativos FOR SELECT
USING (is_authenticated());

CREATE POLICY "Admins can manage informativos"
ON public.informativos FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Tabela de auditoria LGPD
CREATE TABLE IF NOT EXISTS public.auditoria_lgpd (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  acao TEXT NOT NULL,
  tabela_afetada TEXT,
  registro_id UUID,
  user_id UUID REFERENCES auth.users(id),
  dados_antigos JSONB,
  dados_novos JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.auditoria_lgpd ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins read audit logs"
ON public.auditoria_lgpd FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System insert audit logs"
ON public.auditoria_lgpd FOR INSERT
WITH CHECK (is_authenticated());

-- Tabela para credenciais de pais
CREATE TABLE IF NOT EXISTS public.pais_alunos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  nome_responsavel TEXT NOT NULL,
  consentimento_visualizacao BOOLEAN DEFAULT false,
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(aluno_id)
);

ALTER TABLE public.pais_alunos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage pais_alunos"
ON public.pais_alunos FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Criar buckets de storage se não existirem
INSERT INTO storage.buckets (id, name, public) 
VALUES ('fotos_alunos', 'fotos_alunos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('evidencias_agenda', 'evidencias_agenda', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('eventos_colegio', 'eventos_colegio', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para bucket fotos_alunos (privado, só admin)
CREATE POLICY "Admin view fotos_alunos"
ON storage.objects FOR SELECT
USING (bucket_id = 'fotos_alunos' AND (SELECT has_role(auth.uid(), 'admin')));

CREATE POLICY "Admin upload fotos_alunos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'fotos_alunos' AND (SELECT has_role(auth.uid(), 'admin')));

CREATE POLICY "Admin delete fotos_alunos"
ON storage.objects FOR DELETE
USING (bucket_id = 'fotos_alunos' AND (SELECT has_role(auth.uid(), 'admin')));

-- Políticas para bucket evidencias_agenda (público leitura)
CREATE POLICY "Public view evidencias_agenda"
ON storage.objects FOR SELECT
USING (bucket_id = 'evidencias_agenda');

CREATE POLICY "Admin upload evidencias_agenda"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'evidencias_agenda' AND (SELECT has_role(auth.uid(), 'admin')));

CREATE POLICY "Admin delete evidencias_agenda"
ON storage.objects FOR DELETE
USING (bucket_id = 'evidencias_agenda' AND (SELECT has_role(auth.uid(), 'admin')));

-- Políticas para bucket eventos_colegio
CREATE POLICY "Public view eventos_colegio"
ON storage.objects FOR SELECT
USING (bucket_id = 'eventos_colegio');

CREATE POLICY "Admin upload eventos_colegio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'eventos_colegio' AND (SELECT has_role(auth.uid(), 'admin')));

CREATE POLICY "Admin delete eventos_colegio"
ON storage.objects FOR DELETE
USING (bucket_id = 'eventos_colegio' AND (SELECT has_role(auth.uid(), 'admin')));