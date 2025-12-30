export interface MeasurementEntry {
  id: string;
  item?: string;
  date: string;
  responsavel: string;
  local: string;
  disciplina: string;
  tipo?: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  qtdSolicitada?: number;
  valorSolicitado?: number;
  qtdVerificada?: number;
  valorVerificado?: number;
  diferencaQtd?: number;
  classificacao?: 'OBRA' | 'QUALIDADE' | string;
  medicao?: number;
  status: 'normal' | 'outlier' | 'pending' | 'aprovado' | 'error';
  calculatedValue?: number;
  hasCalculationError?: boolean;
  errorDifference?: number;
  errorPercent?: number;
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
  item: string | null;
  date: string | null;
  measurement: string | null;
  value: string | null;
  entity: string | null;
  discipline: string | null;
  description: string | null;
  local: string | null;
  unit: string | null;
  unitPrice: string | null;
  requestedQty: string | null;
  requestedValue: string | null;
  verifiedQty: string | null;
  verifiedValue: string | null;
  classification: string | null;
  measurementNumber: string | null;
}

export interface ImportConfig {
  sheetName: string;
  skipRows: number;
  measurementPeriod: 'current' | 'previous' | 'weekly' | 'daily' | 'monthly';
  baseDate?: string;
}

export interface ParsedSheet {
  name: string;
  columns: string[];
  previewRows: any[][];
  totalRows: number;
  detectedType?: string;
  suggestedSkipRows?: number;
}
