import * as XLSX from 'xlsx';
import { MeasurementEntry, ColumnMapping, ParsedSheet } from '@/types/measurement';

// Keywords for intelligent column mapping (Portuguese/English)
const COLUMN_KEYWORDS: Record<keyof ColumnMapping, string[]> = {
  item: ['item', 'id', 'codigo', 'código', 'num', 'nº'],
  date: ['data', 'date', 'periodo', 'período', 'mes', 'mês'],
  measurement: ['medicao', 'medição', 'quantidade', 'qty', 'qtd', 'qtde', 'amount', 'medido'],
  value: ['valor', 'preço', 'custo', 'total', 'price', 'value', 'valor_total'],
  entity: ['responsavel', 'responsável', 'quem', 'executado', 'executor'],
  discipline: ['disciplina', 'tipo', 'grupo', 'atividade', 'serviço', 'servico'],
  description: ['descricao', 'descrição', 'atividade', 'serviço', 'servico', 'descrição_serviço'],
  local: ['local', 'trecho', 'estaca', 'km', 'localizacao', 'localização'],
  unit: ['unidade', 'un', 'unid', 'un.'],
  unitPrice: ['pu', 'preco_unitario', 'preço_unitário', 'valor_unitario', 'r$_unit'],
  requestedQty: ['qtd_solicitada', 'quantidade_solicitada', 'solicitado'],
  requestedValue: ['valor_solicitado', 'valor_contratado', 'contratado'],
  verifiedQty: ['qtd_verificada', 'verificado', 'qtd_verificada2'],
  verifiedValue: ['valor_verificado', 'verificado_r$'],
  classification: ['classificacao', 'classificação', 'class', 'obra', 'qualidade'],
  measurementNumber: ['med', 'medicao_n', 'medição_nº', 'numero_medicao']
};

export function parseExcelFile(file: File): Promise<{ sheets: ParsedSheet[], workbook: XLSX.WorkBook }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const sheets: ParsedSheet[] = workbook.SheetNames.map(name => {
          const sheet = workbook.Sheets[name];
          const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
          
          // Get columns from first row
          const columns: string[] = [];
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: col })];
            columns.push(cell ? String(cell.v || '') : `Col_${col + 1}`);
          }
          
          // Get preview rows (first 5 data rows)
          const previewRows: any[][] = [];
          for (let row = range.s.r + 1; row <= Math.min(range.s.r + 5, range.e.r); row++) {
            const rowData: any[] = [];
            for (let col = range.s.c; col <= range.e.c; col++) {
              const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
              rowData.push(cell ? cell.v : null);
            }
            previewRows.push(rowData);
          }
          
          return {
            name,
            columns,
            previewRows,
            totalRows: range.e.r - range.s.r
          };
        });
        
        resolve({ sheets, workbook });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function intelligentColumnMapping(columns: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    item: null,
    date: null,
    measurement: null,
    value: null,
    entity: null,
    discipline: null,
    description: null,
    local: null,
    unit: null,
    unitPrice: null,
    requestedQty: null,
    requestedValue: null,
    verifiedQty: null,
    verifiedValue: null,
    classification: null,
    measurementNumber: null
  };

  for (const col of columns) {
    const colLower = col.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    for (const [key, keywords] of Object.entries(COLUMN_KEYWORDS)) {
      if (mapping[key as keyof ColumnMapping] === null) {
        for (const keyword of keywords) {
          const keywordNorm = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (colLower.includes(keywordNorm)) {
            mapping[key as keyof ColumnMapping] = col;
            break;
          }
        }
      }
    }
  }

  return mapping;
}

export function parseSheetData(
  workbook: XLSX.WorkBook,
  sheetName: string,
  skipRows: number,
  columnMapping: ColumnMapping
): MeasurementEntry[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  // Convert to JSON with headers from the specified row
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
    range: skipRows,
    defval: null
  });

  const entries: MeasurementEntry[] = [];
  let outlierThreshold = 0;
  
  // Calculate mean and std for outlier detection
  const values = jsonData
    .map(row => parseFloat(row[columnMapping.measurement || '']) || 0)
    .filter(v => v > 0);
  
  if (values.length > 0) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    outlierThreshold = mean + 3 * std;
  }

  for (const row of jsonData) {
    // Skip header rows (where measurement is null or 0)
    const measurement = parseFloat(row[columnMapping.measurement || '']) || 0;
    if (measurement === 0 && !row[columnMapping.description || '']) continue;

    const valorUnitario = parseFloat(row[columnMapping.unitPrice || '']) || 0;
    const valorTotal = parseFloat(row[columnMapping.value || '']) || measurement * valorUnitario;

    const entry: MeasurementEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      item: row[columnMapping.item || ''] || '',
      date: formatDate(row[columnMapping.date || '']),
      responsavel: row[columnMapping.entity || ''] || 'Não informado',
      local: row[columnMapping.local || ''] || 'Não informado',
      disciplina: row[columnMapping.discipline || ''] || 'Geral',
      tipo: row[columnMapping.discipline || ''] || '',
      descricao: row[columnMapping.description || ''] || 'Sem descrição',
      quantidade: measurement,
      unidade: row[columnMapping.unit || ''] || 'UN',
      valorUnitario,
      valorTotal,
      qtdSolicitada: parseFloat(row[columnMapping.requestedQty || '']) || undefined,
      valorSolicitado: parseFloat(row[columnMapping.requestedValue || '']) || undefined,
      qtdVerificada: parseFloat(row[columnMapping.verifiedQty || '']) || undefined,
      valorVerificado: parseFloat(row[columnMapping.verifiedValue || '']) || undefined,
      classificacao: row[columnMapping.classification || ''] || undefined,
      medicao: parseInt(row[columnMapping.measurementNumber || '']) || undefined,
      status: measurement > outlierThreshold && outlierThreshold > 0 ? 'outlier' : 'normal'
    };

    entries.push(entry);
  }

  return entries;
}

function formatDate(value: any): string {
  if (!value) return new Date().toISOString().split('T')[0];
  
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  
  if (typeof value === 'number') {
    // Excel date serial number
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  
  return String(value);
}

export function exportToExcel(data: MeasurementEntry[], filename: string = 'medicao_export.xlsx') {
  const exportData = data.map(entry => ({
    'Item': entry.item || '',
    'Data': entry.date,
    'Responsável': entry.responsavel,
    'Local': entry.local,
    'Disciplina': entry.disciplina,
    'Descrição': entry.descricao,
    'Quantidade': entry.quantidade,
    'Unidade': entry.unidade,
    'Valor Unitário': entry.valorUnitario,
    'Valor Total': entry.valorTotal,
    'Status': entry.status
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Medições');
  
  XLSX.writeFile(workbook, filename);
}
