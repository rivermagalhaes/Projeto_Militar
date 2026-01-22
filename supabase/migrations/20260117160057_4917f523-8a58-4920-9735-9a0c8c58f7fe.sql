-- Add missing columns to pais_alunos for parent portal login
ALTER TABLE public.pais_alunos 
ADD COLUMN IF NOT EXISTS matricula text,
ADD COLUMN IF NOT EXISTS data_nascimento_text text;

-- Add comments for clarity
COMMENT ON COLUMN public.pais_alunos.matricula IS 'Student enrollment number for parent login';
COMMENT ON COLUMN public.pais_alunos.data_nascimento_text IS 'Student birth date in DD/MM/YYYY format for parent login';