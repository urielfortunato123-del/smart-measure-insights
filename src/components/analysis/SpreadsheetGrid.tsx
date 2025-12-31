import { useState, useCallback, memo } from 'react';
import { CellError } from '@/pages/Analise';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertTriangle, AlertCircle, Info, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpreadsheetGridProps {
  headers: string[];
  data: any[][];
  errors: CellError[];
  onCellChange: (rowIndex: number, colIndex: number, value: any) => void;
}

const getErrorIcon = (severity: CellError['severity']) => {
  switch (severity) {
    case 'error':
      return <AlertCircle className="h-3 w-3 text-destructive" />;
    case 'warning':
      return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
    case 'info':
      return <Info className="h-3 w-3 text-blue-500" />;
  }
};

const getErrorStyle = (type: CellError['type']) => {
  switch (type) {
    case 'calculation':
      return 'bg-destructive/10 border-destructive/50';
    case 'inconsistent':
      return 'bg-yellow-500/10 border-yellow-500/50';
    case 'duplicate':
      return 'bg-orange-500/10 border-orange-500/50';
    case 'missing':
      return 'bg-blue-500/10 border-blue-500/50';
    default:
      return '';
  }
};

const getErrorLabel = (type: CellError['type']) => {
  switch (type) {
    case 'calculation':
      return 'Erro de Cálculo';
    case 'inconsistent':
      return 'Valor Inconsistente';
    case 'duplicate':
      return 'Duplicata';
    case 'missing':
      return 'Dado Faltante';
  }
};

interface CellProps {
  value: any;
  rowIndex: number;
  colIndex: number;
  error?: CellError;
  onCellChange: (rowIndex: number, colIndex: number, value: any) => void;
}

const Cell = memo(({ value, rowIndex, colIndex, error, onCellChange }: CellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value ?? ''));

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== String(value ?? '')) {
      onCellChange(rowIndex, colIndex, editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditValue(String(value ?? ''));
      setIsEditing(false);
    }
  };

  const cellContent = (
    <div
      className={cn(
        "relative min-h-[32px] px-2 py-1 border-r border-b border-border/50 cursor-pointer transition-all",
        "hover:bg-muted/50 focus-within:bg-muted",
        error && getErrorStyle(error.type),
        error && "border-2"
      )}
      onClick={() => setIsEditing(true)}
    >
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full h-full bg-transparent outline-none text-xs"
        />
      ) : (
        <span className="text-xs truncate block pr-4">
          {value ?? ''}
        </span>
      )}
      {error && (
        <div className="absolute top-0.5 right-0.5">
          {getErrorIcon(error.severity)}
        </div>
      )}
    </div>
  );

  if (error) {
    return (
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          {cellContent}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-[300px] p-3 bg-popover border shadow-lg"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getErrorIcon(error.severity)}
              <span className="font-semibold text-sm">{getErrorLabel(error.type)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{error.message}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return cellContent;
});

Cell.displayName = 'Cell';

export const SpreadsheetGrid = ({ headers, data, errors, onCellChange }: SpreadsheetGridProps) => {
  const getErrorForCell = useCallback((rowIndex: number, colIndex: number): CellError | undefined => {
    return errors.find(e => e.row === rowIndex && e.col === colIndex);
  }, [errors]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {/* Header Row */}
        <thead className="sticky top-0 z-10">
          <tr className="bg-muted/80 backdrop-blur-sm">
            <th className="min-w-[40px] w-10 px-2 py-2 border-r border-b border-border/50 text-center text-xs font-medium text-muted-foreground">
              #
            </th>
            {headers.map((header, index) => (
              <th
                key={index}
                className="min-w-[100px] px-2 py-2 border-r border-b border-border/50 text-left text-xs font-medium truncate"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        
        {/* Data Rows */}
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-muted/20">
              {/* Row Number */}
              <td className="px-2 py-1 border-r border-b border-border/50 text-center text-xs text-muted-foreground bg-muted/30">
                {rowIndex + 1}
              </td>
              
              {/* Cells */}
              {headers.map((_, colIndex) => (
                <td key={colIndex} className="p-0">
                  <Cell
                    value={row[colIndex]}
                    rowIndex={rowIndex}
                    colIndex={colIndex}
                    error={getErrorForCell(rowIndex, colIndex)}
                    onCellChange={onCellChange}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
