-- LGPD Compliance: Restringir acesso a dados sensíveis de alunos
-- Apenas admins podem ver dados de alunos (CPF, data nascimento, histórico disciplinar)

-- Remover política permissiva de SELECT para monitores em alunos
DROP POLICY IF EXISTS "Monitors read alunos" ON public.alunos;

-- Remover política permissiva de UPDATE para monitores em alunos
DROP POLICY IF EXISTS "Monitors update alunos nota" ON public.alunos;

-- Apenas admins podem ler alunos
CREATE POLICY "Only admins can read alunos"
ON public.alunos
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem atualizar alunos
CREATE POLICY "Only admins can update alunos"
ON public.alunos
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Corrigir profiles: cada usuário só vê o próprio, admin vê todos
DROP POLICY IF EXISTS "Profiles são visíveis para autenticados" ON public.profiles;

CREATE POLICY "Users can view own profile or admins view all"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR public.has_role(auth.uid(), 'admin')
);

-- Anotações: apenas admins podem ver
DROP POLICY IF EXISTS "Authenticated read anotacoes" ON public.anotacoes;

CREATE POLICY "Only admins can read anotacoes"
ON public.anotacoes
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Elogios: apenas admins podem ver
DROP POLICY IF EXISTS "Authenticated read elogios" ON public.elogios;

CREATE POLICY "Only admins can read elogios"
ON public.elogios
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Termos: apenas admins podem ver
DROP POLICY IF EXISTS "Authenticated read termos" ON public.termos;

CREATE POLICY "Only admins can read termos"
ON public.termos
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Faltas: apenas admins podem ver
DROP POLICY IF EXISTS "Authenticated read faltas" ON public.faltas;

CREATE POLICY "Only admins can read faltas"
ON public.faltas
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Turmas: apenas admins podem ver (dados vinculados a alunos)
DROP POLICY IF EXISTS "Authenticated read turmas" ON public.turmas;

CREATE POLICY "Only admins can read turmas"
ON public.turmas
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- INSERT em anotações/elogios/termos/faltas apenas para admins
DROP POLICY IF EXISTS "Authenticated insert anotacoes" ON public.anotacoes;
DROP POLICY IF EXISTS "Authenticated insert elogios" ON public.elogios;
DROP POLICY IF EXISTS "Authenticated insert termos" ON public.termos;
DROP POLICY IF EXISTS "Authenticated insert faltas" ON public.faltas;

CREATE POLICY "Only admins can insert anotacoes"
ON public.anotacoes
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert elogios"
ON public.elogios
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert termos"
ON public.termos
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert faltas"
ON public.faltas
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));