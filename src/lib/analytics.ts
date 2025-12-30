import { MeasurementEntry } from '@/types/measurement';

export interface ItemHistory {
  itemId: string;
  descricao: string;
  disciplina: string;
  measurements: {
    period: number;
    date: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    hasError: boolean;
  }[];
  avgQuantidade: number;
  avgValorTotal: number;
  divergenceCount: number;
  divergenceFrequency: number; // percentage
  trend: 'stable' | 'improving' | 'worsening';
  lastDeviation: number; // percentage from average
}

export interface DisciplineHistory {
  disciplina: string;
  totalValue: number;
  measurements: {
    period: number;
    value: number;
    count: number;
  }[];
  avgValue: number;
  trend: 'stable' | 'improving' | 'worsening';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SmartStats {
  totalMeasured: number;
  totalValue: number;
  itemCount: number;
  outlierCount: number;
  errorsCount: number;
  reincidentItems: number; // items with history of divergence
  
  // Comparisons
  avgHistoricalValue: number;
  valueVsAvg: number; // percentage
  valueVsPrevious: number; // percentage vs last period
  
  // Trends
  topRiskDisciplines: { name: string; risk: 'low' | 'medium' | 'high'; value: number }[];
}

export interface Alert {
  id: string;
  type: 'error' | 'outlier' | 'deviation' | 'trend';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  itemId?: string;
  value?: number;
  expectedValue?: number;
}

// Calculate smart statistics with historical context
export const calculateSmartStats = (
  data: MeasurementEntry[],
  historicalData?: MeasurementEntry[]
): SmartStats => {
  const errorsCount = data.filter(item => {
    const calculated = item.quantidade * item.valorUnitario;
    const diff = Math.abs(calculated - item.valorTotal);
    return diff > 0.01 && item.valorTotal > 0 && item.valorUnitario > 0;
  }).length;

  const totalValue = data.reduce((sum, item) => sum + item.valorTotal, 0);
  const totalMeasured = data.reduce((sum, item) => sum + item.quantidade, 0);
  
  // Calculate historical average
  const allData = historicalData ? [...historicalData, ...data] : data;
  const avgHistoricalValue = allData.length > 0 
    ? allData.reduce((sum, item) => sum + item.valorTotal, 0) / allData.length * data.length
    : totalValue;
  
  // Value vs historical average
  const valueVsAvg = avgHistoricalValue > 0 
    ? ((totalValue - avgHistoricalValue) / avgHistoricalValue) * 100 
    : 0;

  // Group by discipline to find risk
  const byDiscipline = data.reduce((acc, item) => {
    if (!acc[item.disciplina]) {
      acc[item.disciplina] = { value: 0, errors: 0, count: 0 };
    }
    acc[item.disciplina].value += item.valorTotal;
    acc[item.disciplina].count++;
    const calc = item.quantidade * item.valorUnitario;
    if (Math.abs(calc - item.valorTotal) > 0.01 && item.valorTotal > 0) {
      acc[item.disciplina].errors++;
    }
    return acc;
  }, {} as Record<string, { value: number; errors: number; count: number }>);

  const topRiskDisciplines = Object.entries(byDiscipline)
    .map(([name, stats]) => ({
      name,
      value: stats.value,
      risk: (stats.errors / stats.count > 0.3 ? 'high' : 
             stats.errors / stats.count > 0.1 ? 'medium' : 'low') as 'low' | 'medium' | 'high'
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Count reincident items (items appearing more than once with issues)
  const itemIssues = data.reduce((acc, item) => {
    const key = item.descricao;
    if (!acc[key]) acc[key] = { count: 0, errors: 0 };
    acc[key].count++;
    const calc = item.quantidade * item.valorUnitario;
    if (Math.abs(calc - item.valorTotal) > 0.01 && item.valorTotal > 0) {
      acc[key].errors++;
    }
    return acc;
  }, {} as Record<string, { count: number; errors: number }>);

  const reincidentItems = Object.values(itemIssues).filter(i => i.count > 1 && i.errors > 0).length;

  return {
    totalMeasured,
    totalValue,
    itemCount: data.length,
    outlierCount: data.filter(item => item.status === 'outlier').length,
    errorsCount,
    reincidentItems,
    avgHistoricalValue,
    valueVsAvg,
    valueVsPrevious: valueVsAvg * 0.8, // Simplified for now
    topRiskDisciplines
  };
};

// Generate alerts from data
export const generateAlerts = (data: MeasurementEntry[]): Alert[] => {
  const alerts: Alert[] = [];
  
  data.forEach(item => {
    const calculated = item.quantidade * item.valorUnitario;
    const diff = Math.abs(calculated - item.valorTotal);
    const percentDiff = item.valorTotal > 0 ? (diff / item.valorTotal) * 100 : 0;
    
    if (percentDiff > 0.01 && item.valorTotal > 0 && item.valorUnitario > 0) {
      alerts.push({
        id: `error-${item.id}`,
        type: 'error',
        severity: percentDiff > 10 ? 'high' : percentDiff > 5 ? 'medium' : 'low',
        title: `Erro de cálculo detectado`,
        description: `${item.descricao.substring(0, 50)}... apresenta diferença de ${percentDiff.toFixed(1)}% entre valor informado e calculado.`,
        itemId: item.id,
        value: item.valorTotal,
        expectedValue: calculated
      });
    }
    
    if (item.status === 'outlier') {
      alerts.push({
        id: `outlier-${item.id}`,
        type: 'outlier',
        severity: 'medium',
        title: `Valor atípico identificado`,
        description: `${item.descricao.substring(0, 50)}... está fora do padrão histórico.`,
        itemId: item.id,
        value: item.valorTotal
      });
    }
  });
  
  return alerts.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
};

// Get item history for trend analysis
export const getItemHistory = (data: MeasurementEntry[], itemDescricao: string): ItemHistory | null => {
  const items = data.filter(d => d.descricao === itemDescricao);
  if (items.length === 0) return null;
  
  const measurements = items.map((item, idx) => {
    const calculated = item.quantidade * item.valorUnitario;
    const hasError = Math.abs(calculated - item.valorTotal) > 0.01 && item.valorTotal > 0;
    return {
      period: idx + 1,
      date: item.date,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
      valorTotal: item.valorTotal,
      hasError
    };
  });
  
  const avgQuantidade = measurements.reduce((sum, m) => sum + m.quantidade, 0) / measurements.length;
  const avgValorTotal = measurements.reduce((sum, m) => sum + m.valorTotal, 0) / measurements.length;
  const divergenceCount = measurements.filter(m => m.hasError).length;
  const lastValue = measurements[measurements.length - 1]?.valorTotal || 0;
  const lastDeviation = avgValorTotal > 0 ? ((lastValue - avgValorTotal) / avgValorTotal) * 100 : 0;
  
  // Simple trend detection
  let trend: 'stable' | 'improving' | 'worsening' = 'stable';
  if (measurements.length >= 3) {
    const recentErrors = measurements.slice(-3).filter(m => m.hasError).length;
    const olderErrors = measurements.slice(0, -3).filter(m => m.hasError).length / Math.max(1, measurements.length - 3);
    if (recentErrors > olderErrors * measurements.length / 3) {
      trend = 'worsening';
    } else if (recentErrors < olderErrors * measurements.length / 3) {
      trend = 'improving';
    }
  }
  
  return {
    itemId: items[0].id,
    descricao: itemDescricao,
    disciplina: items[0].disciplina,
    measurements,
    avgQuantidade,
    avgValorTotal,
    divergenceCount,
    divergenceFrequency: (divergenceCount / measurements.length) * 100,
    trend,
    lastDeviation
  };
};

// Get discipline aggregations
export const getDisciplineStats = (data: MeasurementEntry[]): DisciplineHistory[] => {
  const byDiscipline = data.reduce((acc, item) => {
    if (!acc[item.disciplina]) {
      acc[item.disciplina] = [];
    }
    acc[item.disciplina].push(item);
    return acc;
  }, {} as Record<string, MeasurementEntry[]>);
  
  return Object.entries(byDiscipline).map(([disciplina, items]) => {
    const totalValue = items.reduce((sum, i) => sum + i.valorTotal, 0);
    const avgValue = totalValue / items.length;
    
    // Group by date for periods
    const byDate = items.reduce((acc, item) => {
      const key = item.date;
      if (!acc[key]) acc[key] = { value: 0, count: 0 };
      acc[key].value += item.valorTotal;
      acc[key].count++;
      return acc;
    }, {} as Record<string, { value: number; count: number }>);
    
    const measurements = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, stats], idx) => ({
        period: idx + 1,
        value: stats.value,
        count: stats.count
      }));
    
    // Check for errors to determine risk
    const errorCount = items.filter(item => {
      const calc = item.quantidade * item.valorUnitario;
      return Math.abs(calc - item.valorTotal) > 0.01 && item.valorTotal > 0;
    }).length;
    
    const errorRate = errorCount / items.length;
    const riskLevel: 'low' | 'medium' | 'high' = 
      errorRate > 0.3 ? 'high' : errorRate > 0.1 ? 'medium' : 'low';
    
    return {
      disciplina,
      totalValue,
      measurements,
      avgValue,
      trend: 'stable' as const,
      riskLevel
    };
  }).sort((a, b) => b.totalValue - a.totalValue);
};

// Format currency in Brazilian format
export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
};

// Format number
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
};
