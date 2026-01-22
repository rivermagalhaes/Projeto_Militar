-- Remove the constraint that limits nota_disciplinar to -5 to 15
ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS alunos_nota_disciplinar_range;