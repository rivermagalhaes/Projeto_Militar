-- Create manuais table for storing uploaded manuals
CREATE TABLE public.manuais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.manuais ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read manuais
CREATE POLICY "Authenticated users can view manuais"
ON public.manuais
FOR SELECT
USING (is_authenticated());

-- Only admins can insert/update/delete manuais
CREATE POLICY "Admins can insert manuais"
ON public.manuais
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update manuais"
ON public.manuais
FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete manuais"
ON public.manuais
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create storage bucket for manuais
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('manuais', 'manuais', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for manuais bucket
CREATE POLICY "Public read manuais bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'manuais');

CREATE POLICY "Admins can upload to manuais bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'manuais' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete from manuais bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'manuais' AND has_role(auth.uid(), 'admin'));

-- Insert initial manual with the known URL
INSERT INTO public.manuais (nome, url)
VALUES (
  'MANUAL DO ALUNO 2022-REGULAMENTO CMTO V.pdf',
  'https://colegiomilitartocantins.com.br/_lib/file/doc/5/Manual/MANUAL%20DO%20ALUNO%202022-REGULAMENTO%20CMTO%20V.pdf'
);