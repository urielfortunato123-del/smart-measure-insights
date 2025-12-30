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

  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  
  // Find the actual header row by looking for recognizable patterns
  let actualHeaderRow = skipRows;
  let headerColumns: string[] = [];
  
  // Scan rows to find the best header row (one with the most recognizable column names)
  for (let row = Math.max(0, skipRows - 2); row <= Math.min(skipRows + 5, range.e.r); row++) {
    const rowCols: string[] = [];
    let recognizedCount = 0;
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
      const cellValue = cell ? String(cell.v || '').trim() : '';
      rowCols.push(cellValue);
      
      // Check if this looks like a header cell
      const cellLower = cellValue.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const headerKeywords = ['descricao', 'item', 'valor', 'qtd', 'un', 'unidade', 'id', 'total', 'preco', 'atividade', 'servico'];
      if (headerKeywords.some(kw => cellLower.includes(kw))) {
        recognizedCount++;
      }
    }
    
    // If we found a row with 2+ recognized headers, use it
    if (recognizedCount >= 2 && rowCols.filter(c => c !== '').length >= 3) {
      actualHeaderRow = row;
      headerColumns = rowCols;
      console.log('Found header row at:', row, 'with columns:', headerColumns);
      break;
    }
  }

  // If no header was found, try to extract data directly
  if (headerColumns.length === 0 || headerColumns.filter(c => c && !c.startsWith('__')).length < 2) {
    // Direct cell extraction fallback
    console.log('Using direct cell extraction fallback');
    return parseSheetDirectly(sheet, range, skipRows);
  }

  // Convert to JSON with headers from the detected row
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
    range: actualHeaderRow,
    defval: null
  });

  console.log('Parsing sheet:', sheetName, 'with headerRow:', actualHeaderRow);
  console.log('Total rows in JSON:', jsonData.length);
  
  if (jsonData.length > 0) {
    console.log('First row keys:', Object.keys(jsonData[0]));
    console.log('First row sample:', jsonData[0]);
  }

  const entries: MeasurementEntry[] = [];
  let outlierThreshold = 0;
  
  // Build a dynamic column mapping based on actual columns found
  const actualMapping = buildDynamicMapping(Object.keys(jsonData[0] || {}), columnMapping);
  console.log('Dynamic mapping:', actualMapping);
  
  // Try to find the best column for quantity/measurement
  const measurementCol = actualMapping.measurement || actualMapping.requestedQty || actualMapping.verifiedQty;
  const valueCol = actualMapping.value || actualMapping.verifiedValue || actualMapping.requestedValue;
  
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
    // Skip the __rowNum__ property
    const keys = Object.keys(row).filter(k => k !== '__rowNum__');
    if (keys.length === 0) continue;
    
    // Get the first column value to use as item if no specific mapping
    const firstColKey = keys[0];
    const firstColValue = row[firstColKey];
    
    // Try multiple ways to get the description
    const descricao = findValueByPatterns(row, ['descri', 'atividade', 'servic']) || 
                      row[actualMapping.description || ''] || 
                      '';
    
    // Try multiple ways to get the quantity
    let measurement = 0;
    if (measurementCol) {
      measurement = parseFloat(row[measurementCol]) || 0;
    }
    if (measurement === 0) {
      measurement = findNumericByPatterns(row, ['qtd', 'quantidade', 'medido', 'verificado']);
    }
    
    // Try to get unit price and value
    let valorUnitario = findNumericByPatterns(row, ['unit', 'pu', 'p.u', 'preco']) || 
                        parseFloat(row[actualMapping.unitPrice || '']) || 0;
    
    let valorTotal = findNumericByPatterns(row, ['total', 'valor']) || 
                     parseFloat(row[valueCol || '']) || 
                     (measurement * valorUnitario);
    
    // If we still have no values but have numeric columns, take any available
    if (measurement === 0 && valorTotal === 0) {
      const numericValues = keys
        .map(k => parseFloat(row[k]))
        .filter(v => !isNaN(v) && v > 0);
      
      if (numericValues.length >= 1) {
        measurement = numericValues[0];
        if (numericValues.length >= 2) {
          valorTotal = numericValues[numericValues.length - 1];
        }
      }
    }
    
    // Skip completely empty rows or header-like rows
    const hasDescription = descricao && descricao.toString().trim() !== '';
    const hasValue = measurement > 0 || valorTotal > 0;
    const isLikelyHeader = typeof firstColValue === 'string' && 
                           ['item', 'descrição', 'descricao', 'codigo', 'código', 'id'].some(h => 
                             firstColValue.toLowerCase().includes(h));
    
    if (!hasDescription && !hasValue) continue;
    if (isLikelyHeader) continue;

    const unidade = findValueByPatterns(row, ['un', 'unid']) || 
                   row[actualMapping.unit || ''] || 'UN';

    const entry: MeasurementEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      item: row[actualMapping.item || ''] || String(firstColValue || ''),
      date: formatDate(row[actualMapping.date || '']),
      responsavel: row[actualMapping.entity || ''] || 'Não informado',
      local: row[actualMapping.local || ''] || 'Não informado',
      disciplina: row[actualMapping.discipline || ''] || sheetName || 'Geral',
      tipo: row[actualMapping.discipline || ''] || '',
      descricao: descricao || 'Sem descrição',
      quantidade: measurement,
      unidade: unidade,
      valorUnitario,
      valorTotal,
      qtdSolicitada: parseFloat(row[actualMapping.requestedQty || '']) || undefined,
      valorSolicitado: parseFloat(row[actualMapping.requestedValue || '']) || undefined,
      qtdVerificada: parseFloat(row[actualMapping.verifiedQty || '']) || undefined,
      valorVerificado: parseFloat(row[actualMapping.verifiedValue || '']) || undefined,
      classificacao: row[actualMapping.classification || ''] || undefined,
      medicao: parseInt(row[actualMapping.measurementNumber || '']) || undefined,
      status: measurement > outlierThreshold && outlierThreshold > 0 ? 'outlier' : 'normal'
    };

    entries.push(entry);
  }

  console.log('Total entries parsed:', entries.length);
  return entries;
}

// Helper function to find value by pattern matching
function findValueByPatterns(row: Record<string, any>, patterns: string[]): string {
  const keys = Object.keys(row).filter(k => k !== '__rowNum__');
  for (const pattern of patterns) {
    for (const key of keys) {
      const keyLower = key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (keyLower.includes(pattern)) {
        const val = row[key];
        if (val !== null && val !== undefined && String(val).trim() !== '') {
          return String(val);
        }
      }
    }
  }
  return '';
}

// Helper function to find numeric value by pattern matching
function findNumericByPatterns(row: Record<string, any>, patterns: string[]): number {
  const keys = Object.keys(row).filter(k => k !== '__rowNum__');
  for (const pattern of patterns) {
    for (const key of keys) {
      const keyLower = key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (keyLower.includes(pattern)) {
        const val = parseFloat(row[key]);
        if (!isNaN(val) && val > 0) {
          return val;
        }
      }
    }
  }
  return 0;
}

// Build dynamic column mapping based on actual column names
function buildDynamicMapping(columns: string[], baseMapping: ColumnMapping): ColumnMapping {
  const mapping = { ...baseMapping };
  
  for (const col of columns) {
    if (col === '__rowNum__' || col.startsWith('__EMPTY')) continue;
    
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

// Fallback: parse sheet directly cell by cell for sheets without clear headers
function parseSheetDirectly(sheet: XLSX.WorkSheet, range: XLSX.Range, startRow: number): MeasurementEntry[] {
  const entries: MeasurementEntry[] = [];
  
  console.log('Direct parsing from row:', startRow, 'to row:', range.e.r);
  
  for (let row = startRow; row <= range.e.r; row++) {
    const rowData: any[] = [];
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
      rowData.push(cell ? cell.v : null);
    }
    
    // Try to extract meaningful data from the row
    const strings = rowData.filter(v => typeof v === 'string' && v.trim() !== '');
    const numbers = rowData.filter(v => typeof v === 'number' && !isNaN(v));
    
    // Need at least one string (description) and one number (value/qty)
    if (strings.length === 0 && numbers.length === 0) continue;
    
    // Skip rows that look like headers
    const firstString = strings[0] || '';
    if (['item', 'descrição', 'descricao', 'id', 'codigo'].some(h => 
        firstString.toLowerCase().includes(h))) continue;
    
    // Extract what we can
    const description = strings.find(s => s.length > 5) || strings[0] || 'Sem descrição';
    const item = rowData[0] !== null ? String(rowData[0]) : '';
    const quantity = numbers[0] || 0;
    const unitPrice = numbers.length >= 2 ? numbers[numbers.length - 2] : 0;
    const totalValue = numbers.length >= 1 ? numbers[numbers.length - 1] : 0;
    
    // Find unit (usually short strings like UN, M, M2, etc)
    const unit = strings.find(s => s.length <= 4 && /^[A-Z0-9²³]+$/i.test(s.trim())) || 'UN';
    
    if (quantity > 0 || totalValue > 0) {
      entries.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        item: item,
        date: new Date().toISOString().split('T')[0],
        responsavel: 'Não informado',
        local: 'Não informado',
        disciplina: 'Geral',
        tipo: '',
        descricao: description,
        quantidade: quantity,
        unidade: unit,
        valorUnitario: unitPrice,
        valorTotal: totalValue,
        status: 'normal'
      });
    }
  }
  
  console.log('Direct parsing found entries:', entries.length);
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

// Simple function to parse measurement data from workbook
export function parseExcelData(workbook: XLSX.WorkBook): MeasurementEntry[] {
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  
  const sheet = workbook.Sheets[sheetName];
  const typeDetection = detectSpreadsheetType(sheet);
  
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const headerRow = typeDetection.suggestedSkipRows;
  
  // Get columns from header row
  const columns: string[] = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: headerRow, c: col })];
    columns.push(cell ? String(cell.v || '').trim() : `Col_${col + 1}`);
  }
  
  const mapping = intelligentColumnMapping(columns);
  return parseSheetData(workbook, sheetName, headerRow, mapping);
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
