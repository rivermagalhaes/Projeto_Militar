-- Add DELETE policy for monitors on alunos table
CREATE POLICY "Monitors can delete alunos" 
ON public.alunos 
FOR DELETE 
USING (has_role(auth.uid(), 'monitor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));