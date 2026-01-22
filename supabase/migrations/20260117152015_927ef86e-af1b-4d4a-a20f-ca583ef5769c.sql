-- Drop existing restrictive policies and create new ones for admin AND monitor access

-- TURMAS table policies
DROP POLICY IF EXISTS "Only admins can read turmas" ON public.turmas;
DROP POLICY IF EXISTS "Admins and monitors can read turmas" ON public.turmas;

CREATE POLICY "Admins and monitors can read turmas"
ON public.turmas
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'monitor'::app_role)
);

-- ALUNOS table policies
DROP POLICY IF EXISTS "Only admins can read alunos" ON public.alunos;
DROP POLICY IF EXISTS "Admins and monitors can read alunos" ON public.alunos;

CREATE POLICY "Admins and monitors can read alunos"
ON public.alunos
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'monitor'::app_role)
);

-- AGENDA table policies - already has authenticated read, but let's ensure insert/update for monitors
DROP POLICY IF EXISTS "Monitors can insert agenda" ON public.agenda;
DROP POLICY IF EXISTS "Monitors can update own agenda" ON public.agenda;

CREATE POLICY "Monitors can insert agenda"
ON public.agenda
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'monitor'::app_role)
);

CREATE POLICY "Monitors can update own agenda"
ON public.agenda
FOR UPDATE
USING (
  has_role(auth.uid(), 'monitor'::app_role) AND user_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'monitor'::app_role) AND user_id = auth.uid()
);

-- INFORMATIVOS table - ensure monitors can read
DROP POLICY IF EXISTS "Monitors can read informativos" ON public.informativos;

-- Already has "Authenticated read informativos" policy, so monitors can already read

-- PAIS_ALUNOS table policies for monitors
DROP POLICY IF EXISTS "Monitors can manage pais_alunos" ON public.pais_alunos;
DROP POLICY IF EXISTS "Monitors can insert pais_alunos" ON public.pais_alunos;
DROP POLICY IF EXISTS "Monitors can read pais_alunos" ON public.pais_alunos;
DROP POLICY IF EXISTS "Monitors can update pais_alunos" ON public.pais_alunos;

CREATE POLICY "Monitors can insert pais_alunos"
ON public.pais_alunos
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'monitor'::app_role)
);

CREATE POLICY "Monitors can read pais_alunos"
ON public.pais_alunos
FOR SELECT
USING (
  has_role(auth.uid(), 'monitor'::app_role)
);

CREATE POLICY "Monitors can update pais_alunos"
ON public.pais_alunos
FOR UPDATE
USING (
  has_role(auth.uid(), 'monitor'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'monitor'::app_role)
);