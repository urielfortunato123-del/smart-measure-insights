import { MeasurementEntry } from './measurement';
import { TPUEntry } from './tpu';

export type ComparisonType = 'tpu' | 'medicao';

export interface ComparisonItem {
  codigo: string;
  descricao: string;
  unidade?: string;
  
  // Período Base (anterior)
  valorBase?: number;
  quantidadeBase?: number;
  totalBase?: number;
  
  // Período Comparação (atual)
  valorComparacao?: number;
  quantidadeComparacao?: number;
  totalComparacao?: number;
  
  // Métricas calculadas
  variacaoPreco?: number; // percentual
  variacaoQuantidade?: number; // percentual
  variacaoTotal?: number; // percentual
  diferencaValor?: number; // absoluto
  diferencaQuantidade?: number; // absoluto
  
  // Status
  status: 'novo' | 'removido' | 'aumentou' | 'diminuiu' | 'estavel';
}

export interface ComparisonResult {
  tipo: ComparisonType;
  
  // Metadados
  nomeBase: string;
  nomeComparacao: string;
  dataBase?: string;
  dataComparacao?: string;
  
  // Itens comparados
  items: ComparisonItem[];
  
  // Resumo
  resumo: {
    totalItensBase: number;
    totalItensComparacao: number;
    itensNovos: number;
    itensRemovidos: number;
    itensAumentaram: number;
    itensDiminuiram: number;
    itensEstaveis: number;
    
    valorTotalBase: number;
    valorTotalComparacao: number;
    variacaoTotalGeral: number;
    
    maiorAumento?: ComparisonItem;
    maiorReducao?: ComparisonItem;
  };
}

export interface ComparisonFile {
  name: string;
  type: ComparisonType;
  data: TPUEntry[] | MeasurementEntry[];
  dataReferencia?: string;
}
