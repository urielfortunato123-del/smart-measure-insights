export interface MeasurementEntry {
  id: string;
  date: string;
  responsavel: string;
  local: string;
  disciplina: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  status: 'normal' | 'outlier' | 'pending';
}

export interface FilterState {
  responsavel: string[];
  local: string[];
  disciplina: string[];
  dateRange: { start: string; end: string } | null;
}

export interface DashboardStats {
  totalMeasured: number;
  totalValue: number;
  itemCount: number;
  outlierCount: number;
}

export interface ColumnMapping {
  date: string | null;
  measurement: string | null;
  value: string | null;
  entity: string | null;
  discipline: string | null;
  description: string | null;
}
