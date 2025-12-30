import { MeasurementEntry } from '@/types/measurement';

// Empty initial data - user must upload their own spreadsheet
export const sampleMeasurements: MeasurementEntry[] = [];

export const getUniqueValues = (data: MeasurementEntry[], key: keyof MeasurementEntry): string[] => {
  return [...new Set(data.map(item => String(item[key] || '')))].filter(v => v !== '').sort();
};

export const calculateStats = (data: MeasurementEntry[]) => {
  const errorsCount = data.filter(item => {
    const calculated = item.quantidade * item.valorUnitario;
    const diff = Math.abs(calculated - item.valorTotal);
    return diff > 0.01 && item.valorTotal > 0;
  }).length;

  return {
    totalMeasured: data.reduce((sum, item) => sum + item.quantidade, 0),
    totalValue: data.reduce((sum, item) => sum + item.valorTotal, 0),
    itemCount: data.length,
    outlierCount: data.filter(item => item.status === 'outlier').length,
    errorsCount
  };
};

// Detect calculation errors in data
export const detectCalculationErrors = (data: MeasurementEntry[]): MeasurementEntry[] => {
  return data.map(item => {
    const calculatedValue = item.quantidade * item.valorUnitario;
    const difference = Math.abs(calculatedValue - item.valorTotal);
    const percentDiff = item.valorTotal > 0 ? (difference / item.valorTotal) * 100 : 0;
    
    // Mark as error if difference is more than 0.01% and value is significant
    const hasError = percentDiff > 0.01 && item.valorTotal > 0;
    
    return {
      ...item,
      calculatedValue,
      hasCalculationError: hasError,
      errorDifference: hasError ? difference : 0,
      errorPercent: hasError ? percentDiff : 0,
      status: hasError ? 'error' : item.status
    };
  });
};
