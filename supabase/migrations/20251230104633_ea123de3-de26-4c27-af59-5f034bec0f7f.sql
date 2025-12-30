-- Tabela de projetos/contratos
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  contract_value DECIMAL(15,2),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de medições (períodos)
CREATE TABLE public.measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'monthly', -- daily, weekly, monthly
  period_start DATE,
  period_end DATE,
  total_value DECIMAL(15,2) DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft, submitted, approved
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens de medição
CREATE TABLE public.measurement_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  measurement_id UUID NOT NULL REFERENCES public.measurements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  item_code TEXT,
  description TEXT NOT NULL,
  discipline TEXT DEFAULT 'Geral',
  location TEXT DEFAULT 'Não informado',
  unit TEXT DEFAULT 'UN',
  unit_price DECIMAL(15,4) DEFAULT 0,
  quantity DECIMAL(15,4) DEFAULT 0,
  total_value DECIMAL(15,2) DEFAULT 0,
  requested_qty DECIMAL(15,4),
  requested_value DECIMAL(15,2),
  verified_qty DECIMAL(15,4),
  verified_value DECIMAL(15,2),
  status TEXT DEFAULT 'normal', -- normal, outlier, error
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico por item (para análise de tendências)
CREATE TABLE public.item_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_code TEXT NOT NULL,
  description TEXT NOT NULL,
  discipline TEXT,
  measurement_id UUID REFERENCES public.measurements(id) ON DELETE SET NULL,
  quantity DECIMAL(15,4),
  total_value DECIMAL(15,2),
  measured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de alertas gerados pela IA
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  measurement_id UUID REFERENCES public.measurements(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.measurement_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- outlier, calculation_error, trend_warning
  severity TEXT DEFAULT 'warning', -- info, warning, error
  title TEXT NOT NULL,
  description TEXT,
  ai_explanation TEXT,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for measurements
CREATE POLICY "Users can view their own measurements" ON public.measurements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own measurements" ON public.measurements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own measurements" ON public.measurements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own measurements" ON public.measurements FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for measurement_items
CREATE POLICY "Users can view their own items" ON public.measurement_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own items" ON public.measurement_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own items" ON public.measurement_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own items" ON public.measurement_items FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for item_history
CREATE POLICY "Users can view their own history" ON public.item_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own history" ON public.item_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own history" ON public.item_history FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for alerts
CREATE POLICY "Users can view their own alerts" ON public.alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own alerts" ON public.alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own alerts" ON public.alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own alerts" ON public.alerts FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_measurements_project ON public.measurements(project_id);
CREATE INDEX idx_measurement_items_measurement ON public.measurement_items(measurement_id);
CREATE INDEX idx_item_history_item_code ON public.item_history(item_code);
CREATE INDEX idx_alerts_measurement ON public.alerts(measurement_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_measurements_updated_at BEFORE UPDATE ON public.measurements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_measurement_items_updated_at BEFORE UPDATE ON public.measurement_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();