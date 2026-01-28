-- Update portal_pais_get_dashboard RPC to include agenda and fix visibility filters
CREATE OR REPLACE FUNCTION public.portal_pais_get_dashboard(
  p_matricula TEXT,
  p_nascimento TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aluno_id UUID;
  v_aluno JSON;
  v_anotacoes JSON;
  v_elogios JSON;
  v_faltas JSON;
  v_agenda JSON;
  v_manual_url TEXT;
  v_ano_letivo INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  -- Find matching parent access record with matricula and birth date
  SELECT pa.aluno_id INTO v_aluno_id
  FROM pais_alunos pa
  WHERE pa.matricula = p_matricula
    AND pa.data_nascimento_text = p_nascimento
    AND pa.consentimento_visualizacao = true
  LIMIT 1;

  -- If no match, return null (invalid credentials)
  IF v_aluno_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Update last access timestamp
  UPDATE pais_alunos 
  SET ultimo_acesso = NOW()
  WHERE aluno_id = v_aluno_id;

  -- Get student data with turma
  SELECT json_build_object(
    'id', a.id,
    'nome', a.nome,
    'matricula', a.matricula,
    'turma', CASE WHEN t.id IS NOT NULL THEN json_build_object('nome', t.nome, 'ano_letivo', t.ano_letivo) ELSE NULL END,
    'nota_disciplinar', COALESCE(a.nota_disciplinar, 8.00),
    'foto_url', a.foto_url,
    'consentimento_imagem', COALESCE(a.consentimento_imagem, false)
  ) INTO v_aluno
  FROM alunos a
  LEFT JOIN turmas t ON a.turma_id = t.id
  WHERE a.id = v_aluno_id;

  -- Get ALL anotacoes for this student
  SELECT COALESCE(json_agg(json_build_object(
    'id', an.id,
    'tipo', an.tipo,
    'descricao', an.descricao,
    'created_at', an.created_at
  ) ORDER BY an.created_at DESC), '[]'::json) INTO v_anotacoes
  FROM anotacoes an
  WHERE an.aluno_id = v_aluno_id;

  -- Get elogios
  SELECT COALESCE(json_agg(json_build_object(
    'id', e.id,
    'tipo', e.tipo,
    'descricao', e.descricao,
    'created_at', e.created_at
  ) ORDER BY e.created_at DESC), '[]'::json) INTO v_elogios
  FROM elogios e
  WHERE e.aluno_id = v_aluno_id;

  -- Get faltas
  SELECT COALESCE(json_agg(json_build_object(
    'id', f.id,
    'motivo', f.motivo,
    'detalhes', f.detalhes,
    'created_at', f.created_at,
    'data_inicio', f.data_inicio,
    'data_fim', f.data_fim
  ) ORDER BY f.created_at DESC), '[]'::json) INTO v_faltas
  FROM faltas f
  WHERE f.aluno_id = v_aluno_id;

  -- Get upcoming agenda events
  SELECT COALESCE(json_agg(json_build_object(
    'id', ag.id,
    'titulo', ag.titulo,
    'descricao', ag.descricao,
    'data_evento', ag.data_evento,
    'imagem_url', ag.imagem_url
  ) ORDER BY ag.data_evento ASC), '[]'::json) INTO v_agenda
  FROM agenda ag
  WHERE ag.data_evento >= CURRENT_DATE;

  -- Get latest manual URL
  SELECT m.url INTO v_manual_url
  FROM manuais m
  ORDER BY m.uploaded_at DESC
  LIMIT 1;

  -- Return complete dashboard data
  RETURN json_build_object(
    'aluno', v_aluno,
    'anotacoes', v_anotacoes,
    'elogios', v_elogios,
    'faltas', v_faltas,
    'agenda', v_agenda,
    'manual_url', v_manual_url
  );
END;
$$;
