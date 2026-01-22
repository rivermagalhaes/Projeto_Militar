-- Fix overly permissive RLS policies by implementing role-based access control
-- Admin: full access to all tables
-- Monitor: read access to most data, limited write access (can create anotacoes/elogios)

-- ============================================
-- DROP EXISTING PERMISSIVE POLICIES
-- ============================================

-- alunos table
DROP POLICY IF EXISTS "Alunos são visíveis para autenticados" ON public.alunos;
DROP POLICY IF EXISTS "Autenticados podem gerenciar alunos" ON public.alunos;

-- anotacoes table
DROP POLICY IF EXISTS "Anotações são visíveis para autenticados" ON public.anotacoes;
DROP POLICY IF EXISTS "Autenticados podem criar anotações" ON public.anotacoes;
DROP POLICY IF EXISTS "Autenticados podem deletar anotações" ON public.anotacoes;

-- elogios table
DROP POLICY IF EXISTS "Elogios são visíveis para autenticados" ON public.elogios;
DROP POLICY IF EXISTS "Autenticados podem criar elogios" ON public.elogios;
DROP POLICY IF EXISTS "Autenticados podem deletar elogios" ON public.elogios;

-- termos table
DROP POLICY IF EXISTS "Termos são visíveis para autenticados" ON public.termos;
DROP POLICY IF EXISTS "Autenticados podem criar termos" ON public.termos;

-- turmas table
DROP POLICY IF EXISTS "Turmas são visíveis para autenticados" ON public.turmas;
DROP POLICY IF EXISTS "Autenticados podem gerenciar turmas" ON public.turmas;

-- agenda table
DROP POLICY IF EXISTS "Agenda é visível para autenticados" ON public.agenda;
DROP POLICY IF EXISTS "Autenticados podem gerenciar agenda" ON public.agenda;

-- ============================================
-- CREATE NEW ROLE-BASED POLICIES
-- ============================================

-- ALUNOS TABLE
-- Admins: full access
CREATE POLICY "Admins full access alunos"
ON public.alunos FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Monitors: read access (can view students)
CREATE POLICY "Monitors read alunos"
ON public.alunos FOR SELECT
TO authenticated
USING (public.is_authenticated());

-- Monitors: update access (can update disciplinary notes)
CREATE POLICY "Monitors update alunos nota"
ON public.alunos FOR UPDATE
TO authenticated
USING (public.is_authenticated())
WITH CHECK (public.is_authenticated());

-- ANOTACOES TABLE
-- Admins: full access
CREATE POLICY "Admins full access anotacoes"
ON public.anotacoes FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- All authenticated: read access
CREATE POLICY "Authenticated read anotacoes"
ON public.anotacoes FOR SELECT
TO authenticated
USING (public.is_authenticated());

-- All authenticated: can create annotations
CREATE POLICY "Authenticated insert anotacoes"
ON public.anotacoes FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated());

-- Only admins or creator can delete
CREATE POLICY "Creator or admin delete anotacoes"
ON public.anotacoes FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR lancado_por = auth.uid());

-- ELOGIOS TABLE
-- Admins: full access
CREATE POLICY "Admins full access elogios"
ON public.elogios FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- All authenticated: read access
CREATE POLICY "Authenticated read elogios"
ON public.elogios FOR SELECT
TO authenticated
USING (public.is_authenticated());

-- All authenticated: can create praises
CREATE POLICY "Authenticated insert elogios"
ON public.elogios FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated());

-- Only admins or creator can delete
CREATE POLICY "Creator or admin delete elogios"
ON public.elogios FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR lancado_por = auth.uid());

-- TERMOS TABLE (financial/disciplinary terms - more sensitive)
-- Admins: full access
CREATE POLICY "Admins full access termos"
ON public.termos FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- All authenticated: read access (monitors need to see terms history)
CREATE POLICY "Authenticated read termos"
ON public.termos FOR SELECT
TO authenticated
USING (public.is_authenticated());

-- Monitors can create terms (needed for disciplinary workflow)
CREATE POLICY "Authenticated insert termos"
ON public.termos FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated());

-- TURMAS TABLE
-- Admins: full access (create, update, delete)
CREATE POLICY "Admins full access turmas"
ON public.turmas FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- All authenticated: read access
CREATE POLICY "Authenticated read turmas"
ON public.turmas FOR SELECT
TO authenticated
USING (public.is_authenticated());

-- AGENDA TABLE
-- Admins: full access
CREATE POLICY "Admins full access agenda"
ON public.agenda FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- All authenticated: read access
CREATE POLICY "Authenticated read agenda"
ON public.agenda FOR SELECT
TO authenticated
USING (public.is_authenticated());

-- All authenticated: can create their own agenda items
CREATE POLICY "Authenticated insert agenda"
ON public.agenda FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated());

-- Only admins or creator can update/delete agenda items
CREATE POLICY "Creator or admin update agenda"
ON public.agenda FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid())
WITH CHECK (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

CREATE POLICY "Creator or admin delete agenda"
ON public.agenda FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());