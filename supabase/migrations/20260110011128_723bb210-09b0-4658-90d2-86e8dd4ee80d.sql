-- Add ano_letivo to anotacoes, elogios, and faltas tables for year filtering
ALTER TABLE public.anotacoes ADD COLUMN IF NOT EXISTS ano_letivo integer DEFAULT EXTRACT(year FROM now());
ALTER TABLE public.elogios ADD COLUMN IF NOT EXISTS ano_letivo integer DEFAULT EXTRACT(year FROM now());
ALTER TABLE public.faltas ADD COLUMN IF NOT EXISTS ano_letivo integer DEFAULT EXTRACT(year FROM now());

-- Create indexes for efficient year filtering
CREATE INDEX IF NOT EXISTS idx_anotacoes_ano_letivo ON public.anotacoes(ano_letivo);
CREATE INDEX IF NOT EXISTS idx_elogios_ano_letivo ON public.elogios(ano_letivo);
CREATE INDEX IF NOT EXISTS idx_faltas_ano_letivo ON public.faltas(ano_letivo);