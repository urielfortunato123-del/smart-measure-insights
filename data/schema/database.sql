-- Schema do Banco de Dados
-- Engenharia Inteligente de Medições
-- 
-- Este arquivo é apenas referência.
-- As migrações reais estão em supabase/migrations/

-- =====================================================
-- TABELA: projects
-- Projetos de obra/contrato
-- =====================================================
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    contract_value NUMERIC,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABELA: measurements  
-- Medições por período (mensal, quinzenal, etc)
-- =====================================================
CREATE TABLE public.measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    project_id UUID REFERENCES projects(id),
    name TEXT NOT NULL,
    period_type TEXT DEFAULT 'mensal',
    period_start DATE,
    period_end DATE,
    status TEXT DEFAULT 'rascunho',
    total_items INTEGER,
    total_value NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABELA: measurement_items
-- Itens individuais de cada medição
-- =====================================================
CREATE TABLE public.measurement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    measurement_id UUID REFERENCES measurements(id),
    item_code TEXT,
    description TEXT NOT NULL,
    unit TEXT,
    quantity NUMERIC,
    unit_price NUMERIC,
    total_value NUMERIC,
    requested_qty NUMERIC,
    requested_value NUMERIC,
    verified_qty NUMERIC,
    verified_value NUMERIC,
    discipline TEXT,
    location TEXT,
    status TEXT DEFAULT 'pendente',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABELA: item_history
-- Histórico de valores por item (para comparação)
-- =====================================================
CREATE TABLE public.item_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    measurement_id UUID REFERENCES measurements(id),
    item_code TEXT NOT NULL,
    description TEXT NOT NULL,
    discipline TEXT,
    quantity NUMERIC,
    total_value NUMERIC,
    measured_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABELA: alerts
-- Alertas gerados pela análise de IA
-- =====================================================
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    measurement_id UUID REFERENCES measurements(id),
    item_id UUID REFERENCES measurement_items(id),
    title TEXT NOT NULL,
    description TEXT,
    alert_type TEXT NOT NULL,
    severity TEXT DEFAULT 'warning',
    ai_explanation TEXT,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX idx_measurements_user ON measurements(user_id);
CREATE INDEX idx_measurements_project ON measurements(project_id);
CREATE INDEX idx_items_measurement ON measurement_items(measurement_id);
CREATE INDEX idx_items_discipline ON measurement_items(discipline);
CREATE INDEX idx_history_item_code ON item_history(item_code);
CREATE INDEX idx_alerts_measurement ON alerts(measurement_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários só veem seus próprios dados
-- (ver migrações para políticas completas)
