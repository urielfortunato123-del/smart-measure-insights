import * as XLSX from 'xlsx';
import { TPUEntry, TPUImportResult } from '@/types/tpu';

// Parse TPU from Excel file
export const parseTPUExcel = (workbook: XLSX.WorkBook): TPUImportResult => {
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  const entries: TPUEntry[] = [];
  let dataReferencia = '';
  let tipo: 'desonerado' | 'nao_desonerado' = 'nao_desonerado';
  let versao = '';
  
  // Find header info and determine type
  for (let i = 0; i < Math.min(15, jsonData.length); i++) {
    const row = jsonData[i];
    const rowText = row?.join(' ').toLowerCase() || '';
    
    if (rowText.includes('desonerado') && !rowText.includes('não desonerado') && !rowText.includes('nao desonerado')) {
      tipo = 'desonerado';
    } else if (rowText.includes('não desonerado') || rowText.includes('nao desonerado')) {
      tipo = 'nao_desonerado';
    }
    
    // Look for reference date
    const dateMatch = rowText.match(/(\d{2}\/\d{2}\/\d{4})|(\d{2}\/\d{4})/);
    if (dateMatch) {
      dataReferencia = dateMatch[0];
    }
    
    // Look for version
    if (rowText.includes('versão') || rowText.includes('versao')) {
      const versionMatch = rowText.match(/versão?:?\s*([a-z0-9]+)/i);
      if (versionMatch) {
        versao = versionMatch[1];
      }
    }
  }
  
  // Find data start - look for rows with item codes (format like 21.01.01)
  let dataStartRow = 0;
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (row && row[0]) {
      const firstCell = String(row[0]).trim();
      // TPU codes typically start with numbers like "21.01.01" or similar patterns
      if (/^\d{2}\.\d{2}\.\d{2}/.test(firstCell)) {
        dataStartRow = i;
        break;
      }
    }
  }
  
  // Parse data rows
  for (let i = dataStartRow; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length < 3) continue;
    
    const codigo = String(row[0] || '').trim();
    const nome = String(row[1] || '').trim();
    const unidade = String(row[2] || '').trim();
    let precoStr = String(row[3] || '0');
    
    // Skip non-data rows
    if (!codigo || !/^\d{2}\.\d{2}/.test(codigo)) continue;
    if (!nome || nome.length < 3) continue;
    
    // Parse price (handle both "1.234,56" and "1234.56" formats)
    precoStr = precoStr.replace(/\s/g, '');
    let precoUnitario = 0;
    
    if (precoStr.includes(',')) {
      // Brazilian format: 1.234,56
      precoUnitario = parseFloat(precoStr.replace(/\./g, '').replace(',', '.'));
    } else {
      // US format or already parsed: 1234.56
      precoUnitario = parseFloat(precoStr);
    }
    
    if (isNaN(precoUnitario)) precoUnitario = 0;
    
    entries.push({
      id: `tpu-${codigo}-${Date.now()}`,
      codigo,
      nome,
      unidade,
      precoUnitario,
      origem: 'DER-SP',
      tipo,
      dataReferencia,
      versao
    });
  }
  
  return {
    entries,
    totalItems: entries.length,
    origem: 'DER-SP',
    dataReferencia,
    tipo
  };
};

// Parse TPU from text content (extracted from PDF)
export const parseTPUFromText = (text: string): TPUImportResult => {
  const entries: TPUEntry[] = [];
  const lines = text.split('\n');
  
  let dataReferencia = '';
  let tipo: 'desonerado' | 'nao_desonerado' = 'nao_desonerado';
  let versao = '';
  
  // Analyze header info
  const headerText = lines.slice(0, 20).join(' ').toLowerCase();
  
  if (headerText.includes('desonerado') && !headerText.includes('não desonerado') && !headerText.includes('nao desonerado')) {
    tipo = 'desonerado';
  } else if (headerText.includes('não desonerado') || headerText.includes('nao desonerado')) {
    tipo = 'nao_desonerado';
  }
  
  // Extract date
  const dateMatch = headerText.match(/(\d{2}\/\d{2}\/\d{4})|(\d{2}\/\d{4})/);
  if (dateMatch) {
    dataReferencia = dateMatch[0];
  }
  
  // Extract version
  const versionMatch = headerText.match(/versão?:?\s*([a-z0-9]+)/i);
  if (versionMatch) {
    versao = versionMatch[1];
  }
  
  // Parse data lines - TPU format: CODE | NAME | UNIT | PRICE
  // Codes are like "21.01.01.99" or "21.01.01"
  const codePattern = /^(\d{2}\.\d{2}\.\d{2}(?:\.\d{2})?(?:\.\d{2})?)\s+(.+?)\s+(\w+(?:\*?\w*)?)\s+([\d.,]+)$/;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Try to match TPU pattern
    const match = trimmedLine.match(codePattern);
    if (match) {
      const [, codigo, nome, unidade, precoStr] = match;
      
      // Parse price
      let precoUnitario = parseFloat(
        precoStr.replace(/\./g, '').replace(',', '.')
      );
      if (isNaN(precoUnitario)) precoUnitario = 0;
      
      entries.push({
        id: `tpu-${codigo}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        codigo: codigo.trim(),
        nome: nome.trim(),
        unidade: unidade.trim(),
        precoUnitario,
        origem: 'DER-SP',
        tipo,
        dataReferencia,
        versao
      });
    } else {
      // Alternative parsing for rows split across lines or different formats
      // Look for lines that start with a code pattern
      const altMatch = trimmedLine.match(/^(\d{2}\.\d{2}\.\d{2}(?:\.\d{2})?(?:\.\d{2})?)\s+(.+)/);
      if (altMatch) {
        const codigo = altMatch[1];
        const rest = altMatch[2];
        
        // Try to extract unit and price from the rest
        const priceMatch = rest.match(/([\d.,]+)$/);
        const unitMatch = rest.match(/\s+(\w{1,10})\s+[\d.,]+$/);
        
        if (priceMatch) {
          let precoStr = priceMatch[1];
          let precoUnitario = parseFloat(precoStr.replace(/\./g, '').replace(',', '.'));
          if (isNaN(precoUnitario)) precoUnitario = 0;
          
          const unidade = unitMatch ? unitMatch[1] : 'un';
          const nome = unitMatch 
            ? rest.replace(unitMatch[0], '').trim()
            : rest.replace(priceMatch[0], '').trim();
          
          if (nome.length > 2) {
            entries.push({
              id: `tpu-${codigo}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              codigo: codigo.trim(),
              nome: nome.trim(),
              unidade: unidade.trim(),
              precoUnitario,
              origem: 'DER-SP',
              tipo,
              dataReferencia,
              versao
            });
          }
        }
      }
    }
  }
  
  return {
    entries,
    totalItems: entries.length,
    origem: 'DER-SP',
    dataReferencia,
    tipo
  };
};

// Format currency for display
export const formatTPUPrice = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
