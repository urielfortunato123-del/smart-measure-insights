import { useRef, useEffect, useState, useCallback } from 'react';
import jspreadsheet from 'jspreadsheet-ce';
import 'jspreadsheet-ce/dist/jspreadsheet.css';
import 'jsuites/dist/jsuites.css';
import { CellError } from '@/pages/Analise';
import { ErrorDetailModal } from './ErrorDetailModal';

interface ExcelSpreadsheetProps {
  headers: string[];
  data: any[][];
  errors: CellError[];
  onDataChange: (newData: any[][]) => void;
}

export const ExcelSpreadsheet = ({ headers, data, errors, onDataChange }: ExcelSpreadsheetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spreadsheetRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [selectedError, setSelectedError] = useState<CellError | null>(null);
  const [selectedCellValue, setSelectedCellValue] = useState<any>(null);

  // Find error for a specific cell
  const findErrorForCell = useCallback((row: number, col: number) => {
    return errors.find(e => e.row === row && e.col === col);
  }, [errors]);

  // Handle cell click to show error details
  const handleCellClick = useCallback((row: number, col: number) => {
    const error = findErrorForCell(row, col);
    if (error) {
      const cellValue = data[row]?.[col];
      setSelectedCellValue(cellValue);
      setSelectedError(error);
    }
  }, [findErrorForCell, data]);

  // Initialize spreadsheet
  useEffect(() => {
    if (!containerRef.current || spreadsheetRef.current) return;

    // Build columns config from headers
    const columns = headers.map((header, index) => ({
      title: header || `Col ${index + 1}`,
      width: 120,
      align: 'left' as const,
    }));

    // Create spreadsheet instance with worksheets array
    const instances = jspreadsheet(containerRef.current, {
      worksheets: [{
        data: data.length > 0 ? data : [[]],
        columns: columns.length > 0 ? columns : undefined,
        minDimensions: [headers.length || 10, Math.max(data.length, 20)],
        tableOverflow: true,
        tableWidth: '100%',
        tableHeight: 'calc(100vh - 250px)',
        allowInsertRow: true,
        allowInsertColumn: false,
        allowDeleteRow: true,
        allowDeleteColumn: false,
        allowRenameColumn: false,
        columnSorting: true,
        columnDrag: false,
        columnResize: true,
        rowResize: true,
        search: true,
        pagination: 50,
        paginationOptions: [25, 50, 100, 200],
        defaultColWidth: 100,
        freezeColumns: 1,
      }],
      onchange: () => {
        if (spreadsheetRef.current && spreadsheetRef.current[0]) {
          const newData = spreadsheetRef.current[0].getData();
          onDataChange(newData);
        }
      },
    });

    spreadsheetRef.current = instances;
    setIsReady(true);

    return () => {
      if (containerRef.current) {
        jspreadsheet.destroy(containerRef.current as any);
        spreadsheetRef.current = null;
      }
    };
  }, []);

  // Update data when props change
  useEffect(() => {
    if (!spreadsheetRef.current || !isReady || !spreadsheetRef.current[0]) return;
    
    // Only update if data has actually changed
    const currentData = spreadsheetRef.current[0].getData();
    if (JSON.stringify(currentData) !== JSON.stringify(data)) {
      spreadsheetRef.current[0].setData(data);
    }
  }, [data, isReady]);

  // Apply error highlighting and click handlers
  useEffect(() => {
    if (!spreadsheetRef.current || !isReady || !containerRef.current || !spreadsheetRef.current[0]) return;

    // Clear previous styles and event listeners
    const cells = containerRef.current.querySelectorAll('td');
    cells?.forEach(cell => {
      cell.classList.remove('cell-error', 'cell-warning', 'cell-info', 'cell-clickable');
      cell.removeAttribute('title');
      cell.removeAttribute('data-error-row');
      cell.removeAttribute('data-error-col');
    });

    if (errors.length === 0) return;

    // Apply error styles using getCellNameFromCoords
    errors.forEach(error => {
      try {
        const cellName = jspreadsheet.helpers.getCellNameFromCoords(error.col, error.row);
        const cell = spreadsheetRef.current[0]?.getCell(cellName);
        
        if (cell) {
          const severity = error.severity === 'error' ? 'cell-error' : 
                          error.severity === 'warning' ? 'cell-warning' : 'cell-info';
          cell.classList.add(severity, 'cell-clickable');
          cell.setAttribute('title', `🔍 Clique para ver detalhes: ${getErrorLabel(error.type)}`);
          cell.setAttribute('data-error-row', String(error.row));
          cell.setAttribute('data-error-col', String(error.col));
        }
      } catch (e) {
        console.log('Could not highlight cell:', error.row, error.col);
      }
    });

    // Add click handler for error cells
    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('cell-clickable')) {
        const row = parseInt(target.getAttribute('data-error-row') || '-1');
        const col = parseInt(target.getAttribute('data-error-col') || '-1');
        if (row >= 0 && col >= 0) {
          handleCellClick(row, col);
        }
      }
    };

    containerRef.current.addEventListener('click', clickHandler);
    
    return () => {
      containerRef.current?.removeEventListener('click', clickHandler);
    };
  }, [errors, isReady, handleCellClick]);

  const getErrorLabel = (type: CellError['type']) => {
    switch (type) {
      case 'calculation': return 'Erro de Cálculo';
      case 'inconsistent': return 'Valor Inconsistente';
      case 'duplicate': return 'Duplicata';
      case 'missing': return 'Dado Faltante';
    }
  };

  return (
    <>
      <div className="excel-spreadsheet-container">
        <style>{`
          .excel-spreadsheet-container {
            width: 100%;
            height: calc(100vh - 200px);
            overflow: hidden;
          }
          .excel-spreadsheet-container .jexcel {
            font-family: inherit;
            font-size: 12px;
          }
          .excel-spreadsheet-container .jexcel thead td {
            background: hsl(var(--muted)) !important;
            color: hsl(var(--foreground)) !important;
            font-weight: 600;
            border-color: hsl(var(--border)) !important;
          }
          .excel-spreadsheet-container .jexcel tbody td {
            background: #ffffff !important;
            color: #1a1a1a !important;
            border-color: #e5e7eb !important;
          }
          .excel-spreadsheet-container .jexcel tbody td:hover {
            background: hsl(var(--muted)) !important;
          }
          .excel-spreadsheet-container .jexcel tbody td.highlight {
            background: hsl(var(--primary) / 0.1) !important;
          }
          .excel-spreadsheet-container .jexcel_pagination {
            background: hsl(var(--card)) !important;
            color: hsl(var(--foreground)) !important;
            border-color: hsl(var(--border)) !important;
          }
          .excel-spreadsheet-container .jexcel_pagination select,
          .excel-spreadsheet-container .jexcel_pagination input {
            background: hsl(var(--background)) !important;
            color: hsl(var(--foreground)) !important;
            border-color: hsl(var(--border)) !important;
          }
          .excel-spreadsheet-container .jexcel_content {
            background: hsl(var(--background)) !important;
          }
          .excel-spreadsheet-container .jexcel_search {
            background: hsl(var(--background)) !important;
            color: hsl(var(--foreground)) !important;
            border-color: hsl(var(--border)) !important;
          }
          /* Error highlighting with cursor */
          .excel-spreadsheet-container .cell-clickable {
            cursor: pointer !important;
          }
          .excel-spreadsheet-container .cell-error {
            background: hsl(var(--destructive) / 0.2) !important;
            border: 2px solid hsl(var(--destructive)) !important;
          }
          .excel-spreadsheet-container .cell-error:hover {
            background: hsl(var(--destructive) / 0.3) !important;
          }
          .excel-spreadsheet-container .cell-warning {
            background: hsl(45 93% 47% / 0.2) !important;
            border: 2px solid hsl(45 93% 47%) !important;
          }
          .excel-spreadsheet-container .cell-warning:hover {
            background: hsl(45 93% 47% / 0.3) !important;
          }
          .excel-spreadsheet-container .cell-info {
            background: hsl(217 91% 60% / 0.2) !important;
            border: 2px solid hsl(217 91% 60%) !important;
          }
          .excel-spreadsheet-container .cell-info:hover {
            background: hsl(217 91% 60% / 0.3) !important;
          }
          /* Row numbers */
          .excel-spreadsheet-container .jexcel tbody td:first-child {
            background: hsl(var(--muted)) !important;
            color: hsl(var(--muted-foreground)) !important;
            font-weight: 500;
          }
          /* Selection */
          .excel-spreadsheet-container .jexcel tbody td.highlight-selected {
            background: hsl(var(--primary) / 0.15) !important;
            border-color: hsl(var(--primary)) !important;
          }
          /* Toolbar and context menu */
          .jexcel_contextmenu {
            background: hsl(var(--popover)) !important;
            color: hsl(var(--popover-foreground)) !important;
            border-color: hsl(var(--border)) !important;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          }
          .jexcel_contextmenu a {
            color: hsl(var(--popover-foreground)) !important;
          }
          .jexcel_contextmenu a:hover {
            background: hsl(var(--muted)) !important;
          }
          /* Editor input */
          .excel-spreadsheet-container .jexcel input {
            background: hsl(var(--background)) !important;
            color: hsl(var(--foreground)) !important;
          }
          /* Tabs */
          .jexcel_tabs {
            display: none !important;
          }
        `}</style>
        <div ref={containerRef} />
      </div>

      {/* Error Detail Modal */}
      <ErrorDetailModal
        error={selectedError}
        cellValue={selectedCellValue}
        onClose={() => setSelectedError(null)}
      />
    </>
  );
};
