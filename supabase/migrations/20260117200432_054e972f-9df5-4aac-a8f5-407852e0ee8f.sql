-- ===============================================
-- SECURITY REINFORCEMENT MIGRATION - LGPD COMPLIANT
-- ===============================================

-- 1. PROFILES TABLE - Anti-enumeration policies
-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users or admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.profiles;

-- Create restrictive policies for profiles
CREATE POLICY "Users can only view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR auth.uid() = id);

CREATE POLICY "Only admins can update profiles"
ON public.profiles FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete profiles"
ON public.profiles FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 2. ALUNOS TABLE - Additional CHECK constraints
-- Add validation constraints
ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS check_matricula_numeric;
ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS check_nome_length;
ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS check_data_nascimento;

ALTER TABLE public.alunos
ADD CONSTRAINT check_matricula_numeric 
CHECK (matricula IS NULL OR matricula ~ '^[0-9]+$');

ALTER TABLE public.alunos
ADD CONSTRAINT check_nome_length 
CHECK (length(nome) <= 150);

-- Note: CHECK with CURRENT_DATE can fail on restore; using trigger instead
CREATE OR REPLACE FUNCTION public.validate_aluno_nascimento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.data_nascimento >= CURRENT_DATE THEN
    RAISE EXCEPTION 'Data de nascimento deve ser anterior à data atual';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_aluno_nascimento_trigger ON public.alunos;
CREATE TRIGGER validate_aluno_nascimento_trigger
  BEFORE INSERT OR UPDATE ON public.alunos
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_aluno_nascimento();

-- 3. AUDITORIA_LGPD - Security definer function for inserts
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.auditoria_lgpd;

-- Create system insert function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.system_insert_audit(
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

-- Block direct inserts to auditoria_lgpd (use function instead)
CREATE POLICY "No direct inserts to audit log"
ON public.auditoria_lgpd FOR INSERT
WITH CHECK (false);

-- 4. STORAGE POLICIES - Allow monitors to upload
-- Drop existing policies and recreate with monitor access
DROP POLICY IF EXISTS "Admin view fotos_alunos" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload fotos_alunos" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete fotos_alunos" ON storage.objects;

-- Fotos alunos - admin and monitor can view/upload
CREATE POLICY "Admin or monitor view fotos_alunos"
ON storage.objects FOR SELECT
USING (bucket_id = 'fotos_alunos' AND (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'monitor')
));

CREATE POLICY "Admin or monitor upload fotos_alunos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'fotos_alunos' AND (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'monitor')
));

CREATE POLICY "Admin or monitor delete fotos_alunos"
ON storage.objects FOR DELETE
USING (bucket_id = 'fotos_alunos' AND (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'monitor')
));

-- Update evidencias_agenda policies to include monitor
DROP POLICY IF EXISTS "Admin upload evidencias_agenda" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete evidencias_agenda" ON storage.objects;

CREATE POLICY "Admin or monitor upload evidencias_agenda"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'evidencias_agenda' AND (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'monitor')
));

CREATE POLICY "Admin or monitor delete evidencias_agenda"
ON storage.objects FOR DELETE
USING (bucket_id = 'evidencias_agenda' AND (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'monitor')
));

-- Update eventos_colegio policies
DROP POLICY IF EXISTS "Admin upload eventos_colegio" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete eventos_colegio" ON storage.objects;

CREATE POLICY "Admin or monitor upload eventos_colegio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'eventos_colegio' AND (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'monitor')
));

CREATE POLICY "Admin or monitor delete eventos_colegio"
ON storage.objects FOR DELETE
USING (bucket_id = 'eventos_colegio' AND (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'monitor')
));

-- 5. Create rate limiting table for portal pais
CREATE TABLE IF NOT EXISTS public.login_attempts_pais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  attempt_time timestamptz NOT NULL DEFAULT now(),
  matricula text
);

-- Enable RLS
ALTER TABLE public.login_attempts_pais ENABLE ROW LEVEL SECURITY;

-- Only system can insert (via security definer)
CREATE POLICY "No direct access login_attempts"
ON public.login_attempts_pais FOR ALL
USING (false)
WITH CHECK (false);

-- Function to check and log login attempts
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
  p_ip text,
  p_matricula text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts int;
  v_blocked_until timestamptz;
  v_window_start timestamptz := now() - interval '5 minutes';
  v_block_duration interval := interval '15 minutes';
BEGIN
  -- Count attempts in last 5 minutes
  SELECT COUNT(*) INTO v_attempts
  FROM public.login_attempts_pais
  WHERE ip_address = p_ip
    AND attempt_time > v_window_start;

  -- If 5+ attempts, check if still blocked
  IF v_attempts >= 5 THEN
    -- Get most recent attempt
    SELECT attempt_time + v_block_duration INTO v_blocked_until
    FROM public.login_attempts_pais
    WHERE ip_address = p_ip
    ORDER BY attempt_time DESC
    LIMIT 1;
    
    IF v_blocked_until > now() THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'blocked_until', v_blocked_until,
        'attempts', v_attempts
      );
    END IF;
  END IF;

  -- Log this attempt
  INSERT INTO public.login_attempts_pais (ip_address, matricula)
  VALUES (p_ip, p_matricula);

  -- Clean old attempts (older than 1 hour)
  DELETE FROM public.login_attempts_pais
  WHERE attempt_time < now() - interval '1 hour';

  RETURN jsonb_build_object(
    'allowed', true,
    'attempts', v_attempts + 1
  );
END;
$$;

-- Function to clear attempts on successful login
CREATE OR REPLACE FUNCTION public.clear_login_attempts(p_ip text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts_pais
  WHERE ip_address = p_ip;
END;
$$;

-- 6. Add index for performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time 
ON public.login_attempts_pais (ip_address, attempt_time DESC);