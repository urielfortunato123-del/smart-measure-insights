-- Criar tabela para levantamentos de projeto
CREATE TABLE public.project_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mind_map_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_file_name TEXT,
  source_file_type TEXT,
  total_items INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para itens do levantamento parcial
CREATE TABLE public.survey_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  survey_id UUID NOT NULL REFERENCES public.project_surveys(id) ON DELETE CASCADE,
  item_code TEXT,
  description TEXT NOT NULL,
  unit TEXT DEFAULT 'UN',
  total_quantity NUMERIC DEFAULT 0,
  partial_quantity NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  total_value NUMERIC DEFAULT 0,
  location TEXT,
  floor_level TEXT,
  sector TEXT,
  notes TEXT,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_items ENABLE ROW LEVEL SECURITY;

-- Policies for project_surveys
CREATE POLICY "Users can view their own surveys"
ON public.project_surveys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own surveys"
ON public.project_surveys FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own surveys"
ON public.project_surveys FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own surveys"
ON public.project_surveys FOR DELETE
USING (auth.uid() = user_id);

-- Policies for survey_items
CREATE POLICY "Users can view their own survey items"
ON public.survey_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own survey items"
ON public.survey_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own survey items"
ON public.survey_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own survey items"
ON public.survey_items FOR DELETE
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_project_surveys_updated_at
BEFORE UPDATE ON public.project_surveys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_survey_items_updated_at
BEFORE UPDATE ON public.survey_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);

-- Storage policies
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);