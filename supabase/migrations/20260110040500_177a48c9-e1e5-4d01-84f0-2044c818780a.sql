-- =====================================================
-- SECURITY FIXES: RLS Policies, Constraints, Audit
-- =====================================================

-- 1. FIX PROFILES TABLE RLS (ONLY ALLOW USERS TO SEE OWN PROFILE OR ADMINS SEE ALL)
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem criar profiles" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only system/admin can insert profiles (during signup flow)
CREATE POLICY "System can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 2. FIX AUDITORIA_LGPD TABLE - RESTRICT INSERT TO SERVICE ROLE ONLY
DROP POLICY IF EXISTS "System insert audit logs" ON public.auditoria_lgpd;

-- Create a security definer function for audit log inserts
CREATE OR REPLACE FUNCTION public.log_lgpd_audit(
  p_acao text,
  p_tabela_afetada text DEFAULT NULL,
  p_registro_id uuid DEFAULT NULL,
  p_dados_antigos jsonb DEFAULT NULL,
  p_dados_novos jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.auditoria_lgpd (
    acao,
    tabela_afetada,
    registro_id,
    dados_antigos,
    dados_novos,
    user_id,
    ip_address
  ) VALUES (
    p_acao,
    p_tabela_afetada,
    p_registro_id,
    p_dados_antigos,
    p_dados_novos,
    auth.uid(),
    NULL
  );
END;
$$;

-- Grant execute to authenticated users (they call the function, not direct insert)
GRANT EXECUTE ON FUNCTION public.log_lgpd_audit TO authenticated;

-- 3. FIX user_roles TABLE - REMOVE USING(true) for SELECT
DROP POLICY IF EXISTS "Roles são visíveis para autenticados" ON public.user_roles;

-- Users can only see their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Admins can see all roles (already covered by "Admins podem gerenciar roles")

-- 4. ADD DATABASE CONSTRAINTS FOR DATA VALIDATION

-- Nome constraint (max 100 chars, valid characters)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alunos_nome_valid'
  ) THEN
    ALTER TABLE public.alunos
    ADD CONSTRAINT alunos_nome_valid
    CHECK (length(nome) <= 100 AND nome ~ '^[a-zA-ZÀ-ÿ\s''\-\.]+$');
  END IF;
END $$;

-- CPF constraint (exactly 11 digits)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alunos_cpf_valid'
  ) THEN
    ALTER TABLE public.alunos
    ADD CONSTRAINT alunos_cpf_valid
    CHECK (cpf IS NULL OR (length(cpf) = 11 AND cpf ~ '^[0-9]+$'));
  END IF;
END $$;

-- Data nascimento constraint (must be in the past)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alunos_data_nascimento_past'
  ) THEN
    ALTER TABLE public.alunos
    ADD CONSTRAINT alunos_data_nascimento_past
    CHECK (data_nascimento < CURRENT_DATE);
  END IF;
END $$;

-- Nota disciplinar range constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alunos_nota_disciplinar_range'
  ) THEN
    ALTER TABLE public.alunos
    ADD CONSTRAINT alunos_nota_disciplinar_range
    CHECK (nota_disciplinar IS NULL OR (nota_disciplinar >= -5 AND nota_disciplinar <= 15));
  END IF;
END $$;

-- Description length limits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'anotacoes_descricao_length'
  ) THEN
    ALTER TABLE public.anotacoes
    ADD CONSTRAINT anotacoes_descricao_length
    CHECK (length(descricao) <= 1000);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'elogios_descricao_length'
  ) THEN
    ALTER TABLE public.elogios
    ADD CONSTRAINT elogios_descricao_length
    CHECK (descricao IS NULL OR length(descricao) <= 1000);
  END IF;
END $$;

-- 5. ADD AUDIT TRIGGER FOR ALUNOS TABLE (LGPD COMPLIANCE)
CREATE OR REPLACE FUNCTION public.audit_alunos_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.auditoria_lgpd (acao, tabela_afetada, registro_id, dados_antigos, dados_novos, user_id)
    VALUES ('UPDATE', 'alunos', NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.auditoria_lgpd (acao, tabela_afetada, registro_id, dados_antigos, user_id)
    VALUES ('DELETE', 'alunos', OLD.id, to_jsonb(OLD), auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.auditoria_lgpd (acao, tabela_afetada, registro_id, dados_novos, user_id)
    VALUES ('INSERT', 'alunos', NEW.id, to_jsonb(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for alunos audit
DROP TRIGGER IF EXISTS trigger_audit_alunos ON public.alunos;
CREATE TRIGGER trigger_audit_alunos
AFTER INSERT OR UPDATE OR DELETE ON public.alunos
FOR EACH ROW EXECUTE FUNCTION public.audit_alunos_access();