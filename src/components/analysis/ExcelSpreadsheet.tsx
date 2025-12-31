import { useRef, useEffect, useState } from 'react';
import jspreadsheet from 'jspreadsheet-ce';
import 'jspreadsheet-ce/dist/jspreadsheet.css';
import 'jsuites/dist/jsuites.css';
import { CellError } from '@/pages/Analise';

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

  // Apply error highlighting
  useEffect(() => {
    if (!spreadsheetRef.current || !isReady || errors.length === 0) return;
    if (!containerRef.current || !spreadsheetRef.current[0]) return;

    // Clear previous styles
    const cells = containerRef.current.querySelectorAll('td');
    cells?.forEach(cell => {
      cell.classList.remove('cell-error', 'cell-warning', 'cell-info');
      cell.removeAttribute('title');
    });

    // Apply error styles using getCellNameFromCoords
    errors.forEach(error => {
      try {
        const cellName = jspreadsheet.helpers.getCellNameFromCoords(error.col, error.row);
        const cell = spreadsheetRef.current[0]?.getCell(cellName);
        
        if (cell) {
          const severity = error.severity === 'error' ? 'cell-error' : 
                          error.severity === 'warning' ? 'cell-warning' : 'cell-info';
          cell.classList.add(severity);
          cell.setAttribute('title', `${getErrorLabel(error.type)}: ${error.message}`);
        }
      } catch (e) {
        console.log('Could not highlight cell:', error.row, error.col);
      }
    });
  }, [errors, isReady]);

  const getErrorLabel = (type: CellError['type']) => {
    switch (type) {
      case 'calculation': return 'Erro de Cálculo';
      case 'inconsistent': return 'Valor Inconsistente';
      case 'duplicate': return 'Duplicata';
      case 'missing': return 'Dado Faltante';
    }
  };

  return (
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
          background: hsl(var(--card)) !important;
          color: hsl(var(--foreground)) !important;
          border-color: hsl(var(--border) / 0.5) !important;
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
        /* Error highlighting */
        .excel-spreadsheet-container .cell-error {
          background: hsl(var(--destructive) / 0.2) !important;
          border: 2px solid hsl(var(--destructive)) !important;
        }
        .excel-spreadsheet-container .cell-warning {
          background: hsl(45 93% 47% / 0.2) !important;
          border: 2px solid hsl(45 93% 47%) !important;
        }
        .excel-spreadsheet-container .cell-info {
          background: hsl(217 91% 60% / 0.2) !important;
          border: 2px solid hsl(217 91% 60%) !important;
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
  );
};
