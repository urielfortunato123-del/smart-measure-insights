import { TPUEntry } from '@/types/tpu';
import { MeasurementEntry } from '@/types/measurement';
import { ComparisonItem, ComparisonResult, ComparisonType } from '@/types/comparison';

const THRESHOLD_ESTAVEL = 0.5; // 0.5% de variação é considerado estável

export function compareTPU(
  base: TPUEntry[],
  comparacao: TPUEntry[],
  nomeBase: string,
  nomeComparacao: string
): ComparisonResult {
  const baseMap = new Map(base.map(item => [item.codigo, item]));
  const comparacaoMap = new Map(comparacao.map(item => [item.codigo, item]));
  
  const allCodigos = new Set([...baseMap.keys(), ...comparacaoMap.keys()]);
  const items: ComparisonItem[] = [];
  
  allCodigos.forEach(codigo => {
    const itemBase = baseMap.get(codigo);
    const itemComp = comparacaoMap.get(codigo);
    
    let status: ComparisonItem['status'] = 'estavel';
    let variacaoPreco: number | undefined;
    let diferencaValor: number | undefined;
    
    if (!itemBase && itemComp) {
      status = 'novo';
    } else if (itemBase && !itemComp) {
      status = 'removido';
    } else if (itemBase && itemComp) {
      diferencaValor = itemComp.precoUnitario - itemBase.precoUnitario;
      variacaoPreco = itemBase.precoUnitario > 0 
        ? ((itemComp.precoUnitario - itemBase.precoUnitario) / itemBase.precoUnitario) * 100
        : 0;
      
      if (Math.abs(variacaoPreco) <= THRESHOLD_ESTAVEL) {
        status = 'estavel';
      } else if (variacaoPreco > 0) {
        status = 'aumentou';
      } else {
        status = 'diminuiu';
      }
    }
    
    items.push({
      codigo,
      descricao: itemComp?.nome || itemBase?.nome || '',
      unidade: itemComp?.unidade || itemBase?.unidade,
      valorBase: itemBase?.precoUnitario,
      valorComparacao: itemComp?.precoUnitario,
      variacaoPreco,
      diferencaValor,
      status
    });
  });
  
  // Sort by absolute variation descending
  items.sort((a, b) => Math.abs(b.variacaoPreco || 0) - Math.abs(a.variacaoPreco || 0));
  
  const itensNovos = items.filter(i => i.status === 'novo').length;
  const itensRemovidos = items.filter(i => i.status === 'removido').length;
  const itensAumentaram = items.filter(i => i.status === 'aumentou').length;
  const itensDiminuiram = items.filter(i => i.status === 'diminuiu').length;
  const itensEstaveis = items.filter(i => i.status === 'estavel').length;
  
  const valorTotalBase = base.reduce((sum, i) => sum + i.precoUnitario, 0);
  const valorTotalComparacao = comparacao.reduce((sum, i) => sum + i.precoUnitario, 0);
  const variacaoTotalGeral = valorTotalBase > 0 
    ? ((valorTotalComparacao - valorTotalBase) / valorTotalBase) * 100 
    : 0;
  
  const aumentos = items.filter(i => i.status === 'aumentou' && i.variacaoPreco);
  const reducoes = items.filter(i => i.status === 'diminuiu' && i.variacaoPreco);
  
  return {
    tipo: 'tpu',
    nomeBase,
    nomeComparacao,
    items,
    resumo: {
      totalItensBase: base.length,
      totalItensComparacao: comparacao.length,
      itensNovos,
      itensRemovidos,
      itensAumentaram,
      itensDiminuiram,
      itensEstaveis,
      valorTotalBase,
      valorTotalComparacao,
      variacaoTotalGeral,
      maiorAumento: aumentos.sort((a, b) => (b.variacaoPreco || 0) - (a.variacaoPreco || 0))[0],
      maiorReducao: reducoes.sort((a, b) => (a.variacaoPreco || 0) - (b.variacaoPreco || 0))[0]
    }
  };
}

export function compareMeasurements(
  base: MeasurementEntry[],
  comparacao: MeasurementEntry[],
  nomeBase: string,
  nomeComparacao: string
): ComparisonResult {
  // Group by item code or description
  const getKey = (item: MeasurementEntry) => item.item || item.descricao;
  
  const baseMap = new Map<string, MeasurementEntry>();
  base.forEach(item => {
    const key = getKey(item);
    if (baseMap.has(key)) {
      const existing = baseMap.get(key)!;
      existing.quantidade += item.quantidade;
      existing.valorTotal += item.valorTotal;
    } else {
      baseMap.set(key, { ...item });
    }
  });
  
  const comparacaoMap = new Map<string, MeasurementEntry>();
  comparacao.forEach(item => {
    const key = getKey(item);
    if (comparacaoMap.has(key)) {
      const existing = comparacaoMap.get(key)!;
      existing.quantidade += item.quantidade;
      existing.valorTotal += item.valorTotal;
    } else {
      comparacaoMap.set(key, { ...item });
    }
  });
  
  const allKeys = new Set([...baseMap.keys(), ...comparacaoMap.keys()]);
  const items: ComparisonItem[] = [];
  
  allKeys.forEach(key => {
    const itemBase = baseMap.get(key);
    const itemComp = comparacaoMap.get(key);
    
    let status: ComparisonItem['status'] = 'estavel';
    let variacaoPreco: number | undefined;
    let variacaoQuantidade: number | undefined;
    let variacaoTotal: number | undefined;
    let diferencaValor: number | undefined;
    let diferencaQuantidade: number | undefined;
    
    if (!itemBase && itemComp) {
      status = 'novo';
    } else if (itemBase && !itemComp) {
      status = 'removido';
    } else if (itemBase && itemComp) {
      // Variação de preço unitário
      if (itemBase.valorUnitario > 0) {
        variacaoPreco = ((itemComp.valorUnitario - itemBase.valorUnitario) / itemBase.valorUnitario) * 100;
        diferencaValor = itemComp.valorUnitario - itemBase.valorUnitario;
      }
      
      // Variação de quantidade
      if (itemBase.quantidade > 0) {
        variacaoQuantidade = ((itemComp.quantidade - itemBase.quantidade) / itemBase.quantidade) * 100;
        diferencaQuantidade = itemComp.quantidade - itemBase.quantidade;
      }
      
      // Variação de valor total
      if (itemBase.valorTotal > 0) {
        variacaoTotal = ((itemComp.valorTotal - itemBase.valorTotal) / itemBase.valorTotal) * 100;
      }
      
      // Status baseado em variação de quantidade (evolução da obra)
      const variacao = variacaoQuantidade || variacaoTotal || 0;
      if (Math.abs(variacao) <= THRESHOLD_ESTAVEL) {
        status = 'estavel';
      } else if (variacao > 0) {
        status = 'aumentou';
      } else {
        status = 'diminuiu';
      }
    }
    
    items.push({
      codigo: key,
      descricao: itemComp?.descricao || itemBase?.descricao || '',
      unidade: itemComp?.unidade || itemBase?.unidade,
      valorBase: itemBase?.valorUnitario,
      valorComparacao: itemComp?.valorUnitario,
      quantidadeBase: itemBase?.quantidade,
      quantidadeComparacao: itemComp?.quantidade,
      totalBase: itemBase?.valorTotal,
      totalComparacao: itemComp?.valorTotal,
      variacaoPreco,
      variacaoQuantidade,
      variacaoTotal,
      diferencaValor,
      diferencaQuantidade,
      status
    });
  });
  
  // Sort by absolute total variation descending
  items.sort((a, b) => Math.abs(b.variacaoTotal || b.variacaoQuantidade || 0) - Math.abs(a.variacaoTotal || a.variacaoQuantidade || 0));
  
  const itensNovos = items.filter(i => i.status === 'novo').length;
  const itensRemovidos = items.filter(i => i.status === 'removido').length;
  const itensAumentaram = items.filter(i => i.status === 'aumentou').length;
  const itensDiminuiram = items.filter(i => i.status === 'diminuiu').length;
  const itensEstaveis = items.filter(i => i.status === 'estavel').length;
  
  const valorTotalBase = base.reduce((sum, i) => sum + i.valorTotal, 0);
  const valorTotalComparacao = comparacao.reduce((sum, i) => sum + i.valorTotal, 0);
  const variacaoTotalGeral = valorTotalBase > 0 
    ? ((valorTotalComparacao - valorTotalBase) / valorTotalBase) * 100 
    : 0;
  
  const aumentos = items.filter(i => i.status === 'aumentou');
  const reducoes = items.filter(i => i.status === 'diminuiu');
  
  return {
    tipo: 'medicao',
    nomeBase,
    nomeComparacao,
    items,
    resumo: {
      totalItensBase: base.length,
      totalItensComparacao: comparacao.length,
      itensNovos,
      itensRemovidos,
      itensAumentaram,
      itensDiminuiram,
      itensEstaveis,
      valorTotalBase,
      valorTotalComparacao,
      variacaoTotalGeral,
      maiorAumento: aumentos.sort((a, b) => (b.variacaoTotal || 0) - (a.variacaoTotal || 0))[0],
      maiorReducao: reducoes.sort((a, b) => (a.variacaoTotal || 0) - (b.variacaoTotal || 0))[0]
    }
  };
}

export function formatVariation(value: number | undefined): string {
  if (value === undefined) return '-';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function getStatusColor(status: ComparisonItem['status']): string {
  switch (status) {
    case 'novo': return 'text-primary';
    case 'removido': return 'text-destructive';
    case 'aumentou': return 'text-warning';
    case 'diminuiu': return 'text-success';
    case 'estavel': return 'text-muted-foreground';
    default: return 'text-foreground';
  }
}

export function getStatusBadgeVariant(status: ComparisonItem['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'novo': return 'default';
    case 'removido': return 'destructive';
    case 'aumentou': return 'secondary';
    case 'diminuiu': return 'secondary';
    default: return 'outline';
  }
}

export function getStatusLabel(status: ComparisonItem['status']): string {
  switch (status) {
    case 'novo': return 'Novo';
    case 'removido': return 'Removido';
    case 'aumentou': return 'Aumentou';
    case 'diminuiu': return 'Diminuiu';
    case 'estavel': return 'Estável';
    default: return status;
  }
}
