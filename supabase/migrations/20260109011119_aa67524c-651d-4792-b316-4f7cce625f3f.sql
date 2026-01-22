-- Tabela de faltas justificadas para alunos
CREATE TABLE public.faltas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  motivo TEXT NOT NULL,
  detalhes TEXT,
  lancado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faltas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins full access faltas" 
ON public.faltas 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read faltas" 
ON public.faltas 
FOR SELECT 
USING (public.is_authenticated());

CREATE POLICY "Authenticated insert faltas" 
ON public.faltas 
FOR INSERT 
WITH CHECK (public.is_authenticated());

CREATE POLICY "Creator or admin delete faltas" 
ON public.faltas 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin') OR (lancado_por = auth.uid()));