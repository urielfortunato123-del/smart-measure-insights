import * as XLSX from 'xlsx';
import { MeasurementEntry, ColumnMapping, ParsedSheet } from '@/types/measurement';

// Keywords for intelligent column mapping (Portuguese/English)
const COLUMN_KEYWORDS: Record<keyof ColumnMapping, string[]> = {
  item: ['item', 'id', 'codigo', 'código', 'num', 'nº', 'linha'],
  date: ['data', 'date', 'periodo', 'período', 'mes', 'mês'],
  measurement: ['qtde', 'qtd', 'quantidade', 'qty', 'amount', 'medido'],
  value: ['valor', 'preço', 'custo', 'total', 'price', 'value', 'valor_total'],
  entity: ['responsavel', 'responsável', 'quem', 'executado', 'executor', 'contratada'],
  discipline: ['disciplina', 'tipo', 'grupo', 'atividade'],
  description: ['descricao', 'descrição', 'atividade', 'serviço', 'servico', 'descrição_serviço', 'descrição serviço'],
  local: ['local', 'trecho', 'estaca', 'km', 'localizacao', 'localização'],
  unit: ['unidade', 'un', 'unid', 'un.'],
  unitPrice: ['pu', 'p.u', 'p.u.', 'preco_unitario', 'preço_unitário', 'valor_unitario', 'valor unitario'],
  requestedQty: ['qtd_solicitada', 'quantidade_solicitada', 'solicitado'],
  requestedValue: ['valor_solicitado', 'valor_contratado', 'contratado', 'valores contratuais'],
  verifiedQty: ['qtd_verificada', 'verificado', 'acumulado'],
  verifiedValue: ['valor_verificado', 'verificado_r$', 'executado'],
  classification: ['classificacao', 'classificação', 'class', 'obra', 'qualidade', 'saldo'],
  measurementNumber: ['med', 'medicao_n', 'medição_nº', 'numero_medicao', 'medição']
};

// Patterns to detect spreadsheet type
const SPREADSHEET_PATTERNS = {
  boletimMedicao: {
    keywords: ['boletim de medição', 'boletim de medicao', 'período de medição', 'contratada:', 'pep:', 'itens contratuais'],
    suggestedSkipRows: 11,
    name: 'Boletim de Medição Financeira'
  },
  memoriaCalculo: {
    keywords: ['memoria de cálculo', 'memória de calculo', 'descrição da atividade', 'valor verificado'],
    suggestedSkipRows: 3,
    name: 'Memória de Cálculo'
  },
  analise: {
    keywords: ['análise medição', 'analise medicao', 'controle de medição'],
    suggestedSkipRows: 5,
    name: 'Análise de Medição'
  }
};

export interface SheetTypeDetection {
  type: string;
  name: string;
  suggestedSkipRows: number;
  confidence: number;
}

function detectSpreadsheetType(sheet: XLSX.WorkSheet): SheetTypeDetection {
  // Get first 15 rows as text for analysis
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const textContent: string[] = [];
  
  for (let row = range.s.r; row <= Math.min(range.s.r + 15, range.e.r); row++) {
    for (let col = range.s.c; col <= Math.min(range.s.c + 10, range.e.c); col++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
      if (cell && cell.v) {
        textContent.push(String(cell.v).toLowerCase());
      }
    }
  }
  
  const fullText = textContent.join(' ');
  
  for (const [type, pattern] of Object.entries(SPREADSHEET_PATTERNS)) {
    const matches = pattern.keywords.filter(kw => fullText.includes(kw.toLowerCase()));
    if (matches.length > 0) {
      return {
        type,
        name: pattern.name,
        suggestedSkipRows: pattern.suggestedSkipRows,
        confidence: matches.length / pattern.keywords.length
      };
    }
  }
  
  // Default: try to find header row
  const headerRow = findHeaderRow(sheet);
  return {
    type: 'unknown',
    name: 'Planilha Genérica',
    suggestedSkipRows: headerRow,
    confidence: 0.5
  };
}

function findHeaderRow(sheet: XLSX.WorkSheet): number {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const headerKeywords = ['descrição', 'descricao', 'item', 'qtde', 'valor', 'un', 'unidade', 'id'];
  
  for (let row = range.s.r; row <= Math.min(range.s.r + 15, range.e.r); row++) {
    let matchCount = 0;
    for (let col = range.s.c; col <= Math.min(range.s.c + 15, range.e.c); col++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
      if (cell && cell.v) {
        const cellText = String(cell.v).toLowerCase();
        if (headerKeywords.some(kw => cellText.includes(kw))) {
          matchCount++;
        }
      }
    }
    if (matchCount >= 2) {
      return row;
    }
  }
  
  return 0;
}

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
          
          // Detect spreadsheet type
          const typeDetection = detectSpreadsheetType(sheet);
          
          // Get columns from header row (after skip)
          const headerRow = typeDetection.suggestedSkipRows;
          const columns: string[] = [];
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cell = sheet[XLSX.utils.encode_cell({ r: headerRow, c: col })];
            columns.push(cell ? String(cell.v || '').trim() : `Col_${col + 1}`);
          }
          
          // Get preview rows (5 data rows after header)
          const previewRows: any[][] = [];
          for (let row = headerRow + 1; row <= Math.min(headerRow + 5, range.e.r); row++) {
            const rowData: any[] = [];
            for (let col = range.s.c; col <= range.e.c; col++) {
              const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
              rowData.push(cell ? cell.v : null);
            }
            previewRows.push(rowData);
          }
          
          return {
            name,
            columns: columns.filter(c => c && c !== ''),
            previewRows,
            totalRows: range.e.r - range.s.r,
            detectedType: typeDetection.name,
            suggestedSkipRows: typeDetection.suggestedSkipRows
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

  console.log('Parsing sheet:', sheetName, 'with skipRows:', skipRows);
  console.log('Total rows in JSON:', jsonData.length);
  console.log('Column mapping:', columnMapping);
  
  if (jsonData.length > 0) {
    console.log('First row keys:', Object.keys(jsonData[0]));
    console.log('First row sample:', jsonData[0]);
  }

  const entries: MeasurementEntry[] = [];
  let outlierThreshold = 0;
  
  // Try to find the best column for quantity/measurement
  const measurementCol = columnMapping.measurement || columnMapping.requestedQty || columnMapping.verifiedQty;
  const valueCol = columnMapping.value || columnMapping.verifiedValue || columnMapping.requestedValue;
  
  // Calculate mean and std for outlier detection
  const values = jsonData
    .map(row => parseFloat(row[measurementCol || '']) || 0)
    .filter(v => v > 0);
  
  if (values.length > 0) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    outlierThreshold = mean + 3 * std;
  }

  for (const row of jsonData) {
    // Get the first column value to use as item if no specific mapping
    const firstColKey = Object.keys(row)[0];
    const firstColValue = row[firstColKey];
    
    // Try multiple ways to get the description
    const descricao = row[columnMapping.description || ''] || 
                      row['Descrição'] || 
                      row['DESCRIÇÃO'] ||
                      row['Descrição do serviço'] ||
                      row['Serviço'] ||
                      row['Atividade'] ||
                      '';
    
    // Try multiple ways to get the quantity
    const measurement = parseFloat(row[measurementCol || '']) || 
                        parseFloat(row['Qtde'] || row['QTDE'] || row['Quantidade'] || row['QTD']) || 
                        0;
    
    // Skip completely empty rows or header-like rows
    const hasDescription = descricao && descricao.toString().trim() !== '';
    const hasValue = measurement > 0 || (valueCol && parseFloat(row[valueCol]) > 0);
    const isLikelyHeader = typeof firstColValue === 'string' && 
                           ['item', 'descrição', 'codigo', 'código'].some(h => 
                             firstColValue.toLowerCase().includes(h));
    
    if (!hasDescription && !hasValue) continue;
    if (isLikelyHeader) continue;

    const valorUnitario = parseFloat(row[columnMapping.unitPrice || ''] || row['PU'] || row['P.U.'] || row['Preço Unit.']) || 0;
    const valorTotal = parseFloat(row[valueCol || ''] || row['Valor'] || row['VALOR'] || row['Valor Total']) || measurement * valorUnitario;

    const entry: MeasurementEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      item: row[columnMapping.item || ''] || firstColValue || '',
      date: formatDate(row[columnMapping.date || '']),
      responsavel: row[columnMapping.entity || ''] || 'Não informado',
      local: row[columnMapping.local || ''] || 'Não informado',
      disciplina: row[columnMapping.discipline || ''] || 'Geral',
      tipo: row[columnMapping.discipline || ''] || '',
      descricao: descricao || 'Sem descrição',
      quantidade: measurement,
      unidade: row[columnMapping.unit || ''] || row['UN'] || row['Unidade'] || 'UN',
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

  console.log('Total entries parsed:', entries.length);
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
