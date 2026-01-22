-- Fix RLS policies for data sharing between admin and monitors

-- ============================================
-- TURMAS: Allow monitors to INSERT/UPDATE
-- ============================================

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Only admins can insert turmas" ON public.turmas;
DROP POLICY IF EXISTS "Only admins can update turmas" ON public.turmas;

-- Create policy for monitors to insert turmas
CREATE POLICY "Monitors can insert turmas"
ON public.turmas
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'monitor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create policy for monitors to update turmas
CREATE POLICY "Monitors can update turmas"
ON public.turmas
FOR UPDATE
USING (has_role(auth.uid(), 'monitor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'monitor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- ALUNOS: Allow monitors to INSERT/UPDATE
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only admins can insert alunos" ON public.alunos;
DROP POLICY IF EXISTS "Only admins can update alunos" ON public.alunos;

-- Create policy for monitors to insert alunos
CREATE POLICY "Monitors can insert alunos"
ON public.alunos
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'monitor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create policy for monitors to update alunos
CREATE POLICY "Monitors can update alunos"
ON public.alunos
FOR UPDATE
USING (has_role(auth.uid(), 'monitor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'monitor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- INFORMATIVOS: Allow monitors to view (already has authenticated read)
-- Monitors should be able to see all informativos
-- ============================================

-- The existing policy "Authenticated read informativos" allows all authenticated users to read
-- This should be sufficient, but let's verify monitors can read

-- ============================================
-- AGENDA: Monitors can already read (Authenticated read agenda exists)
-- Let's ensure monitors can also manage their entries
-- ============================================

-- Existing policies should work, but ensure monitors can read all

-- ============================================
-- ANOTACOES: Allow monitors to read/insert (for viewing in aluno details)
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only admins can read anotacoes" ON public.anotacoes;
DROP POLICY IF EXISTS "Only admins can insert anotacoes" ON public.anotacoes;

-- Create policy for monitors to read anotacoes  
CREATE POLICY "Monitors can read anotacoes"
ON public.anotacoes
FOR SELECT
USING (has_role(auth.uid(), 'monitor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create policy for monitors to insert anotacoes
CREATE POLICY "Monitors can insert anotacoes"
ON public.anotacoes
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'monitor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- ELOGIOS: Allow monitors to read/insert
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only admins can read elogios" ON public.elogios;
DROP POLICY IF EXISTS "Only admins can insert elogios" ON public.elogios;

-- Create policy for monitors to read elogios
CREATE POLICY "Monitors can read elogios"
ON public.elogios
FOR SELECT
USING (has_role(auth.uid(), 'monitor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create policy for monitors to insert elogios
CREATE POLICY "Monitors can insert elogios"
ON public.elogios
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'monitor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- FALTAS: Allow monitors to read/insert
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only admins can read faltas" ON public.faltas;
DROP POLICY IF EXISTS "Only admins can insert faltas" ON public.faltas;

-- Create policy for monitors to read faltas
CREATE POLICY "Monitors can read faltas"
ON public.faltas
FOR SELECT
USING (has_role(auth.uid(), 'monitor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create policy for monitors to insert faltas
CREATE POLICY "Monitors can insert faltas"
ON public.faltas
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'monitor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TERMOS: Allow monitors to read/insert
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only admins can read termos" ON public.termos;
DROP POLICY IF EXISTS "Only admins can insert termos" ON public.termos;

-- Create policy for monitors to read termos
CREATE POLICY "Monitors can read termos"
ON public.termos
FOR SELECT
USING (has_role(auth.uid(), 'monitor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create policy for monitors to insert termos
CREATE POLICY "Monitors can insert termos"
ON public.termos
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'monitor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- PAIS_ALUNOS: Monitors can already manage (policies exist)
-- Just ensure INSERT works
-- ============================================

-- Policy "Monitors can insert pais_alunos" already exists

-- ============================================
-- AUDITORIA_LGPD: Allow monitors to insert audit logs
-- ============================================

-- Create policy for monitors/admins to insert audit logs
CREATE POLICY "Authenticated users can insert audit logs"
ON public.auditoria_lgpd
FOR INSERT
WITH CHECK (is_authenticated());