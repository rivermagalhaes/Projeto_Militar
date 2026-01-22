-- Enforce numeric-only matricula on alunos
ALTER TABLE public.alunos
  ADD CONSTRAINT alunos_matricula_digits_only
  CHECK (matricula IS NULL OR matricula ~ '^\d+$');
