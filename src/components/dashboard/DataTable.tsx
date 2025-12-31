import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, AlertTriangle, ChevronUp, ChevronDown, Download, AlertCircle, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { MeasurementEntry } from '@/types/measurement';
import { exportToExcel } from '@/lib/excelParser';

interface DataTableProps {
  data: MeasurementEntry[];
}

type SortField = 'date' | 'valorTotal' | 'quantidade';
type SortDirection = 'asc' | 'desc';

export const DataTable = ({ data }: DataTableProps) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  // Process data to detect calculation errors
  const processedData = useMemo(() => {
    return data.map(item => {
      const calculatedValue = item.quantidade * item.valorUnitario;
      const difference = Math.abs(calculatedValue - item.valorTotal);
      const percentDiff = item.valorTotal > 0 ? (difference / item.valorTotal) * 100 : 0;
      const hasError = percentDiff > 0.01 && item.valorTotal > 0 && item.valorUnitario > 0;
      
      return {
        ...item,
        calculatedValue,
        hasCalculationError: hasError,
        errorDifference: difference,
        errorPercent: percentDiff
      };
    });
  }, [data]);

  const errorCount = processedData.filter(item => item.hasCalculationError).length;

  const filteredData = processedData.filter(item => {
    const matchesSearch = 
      item.descricao.toLowerCase().includes(search.toLowerCase()) ||
      item.responsavel.toLowerCase().includes(search.toLowerCase()) ||
      item.local.toLowerCase().includes(search.toLowerCase()) ||
      item.disciplina.toLowerCase().includes(search.toLowerCase());
    
    if (showOnlyErrors) {
      return matchesSearch && item.hasCalculationError;
    }
    return matchesSearch;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    
    if (sortField === 'date') {
      return multiplier * a.date.localeCompare(b.date);
    }
    return multiplier * (a[sortField] - b[sortField]);
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      maximumFractionDigits: 2 
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 inline ml-1" /> : 
      <ChevronDown className="h-4 w-4 inline ml-1" />;
  };

  const handleExport = () => {
    exportToExcel(sortedData, `medicao_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export corrected data (with calculated values fixed)
  const handleExportCorrected = () => {
    const correctedData = processedData.map(item => ({
      ...item,
      valorTotal: item.calculatedValue || item.valorTotal,
      status: 'normal' as const
    }));
    exportToExcel(correctedData, `medicao_corrigida_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg font-semibold">Navegador de Dados</CardTitle>
          {errorCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {errorCount} erro{errorCount > 1 ? 's' : ''} de cálculo
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar medições..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary/50"
            />
          </div>
          {errorCount > 0 && (
            <Button 
              variant={showOnlyErrors ? "default" : "secondary"} 
              size="sm" 
              onClick={() => setShowOnlyErrors(!showOnlyErrors)}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Erros
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
          {errorCount > 0 && (
            <Button variant="default" size="sm" onClick={handleExportCorrected}>
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Exportar Corrigida
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead 
                    className="cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    Data <SortIcon field="date" />
                  </TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead className="max-w-[200px]">Descrição</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('quantidade')}
                  >
                    Qtd <SortIcon field="quantidade" />
                  </TableHead>
                  <TableHead className="text-right">P.U.</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('valorTotal')}
                  >
                    Valor Total <SortIcon field="valorTotal" />
                  </TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {data.length === 0 ? 'Carregue uma planilha para visualizar os dados' : 'Nenhum resultado encontrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedData.map((item) => (
                    <TableRow 
                      key={item.id} 
                      className={`border-border ${
                        item.hasCalculationError 
                          ? 'bg-destructive/10 hover:bg-destructive/15' 
                          : item.status === 'outlier' 
                            ? 'bg-warning/5' 
                            : ''
                      }`}
                    >
                      <TableCell className="font-medium">{formatDate(item.date)}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[120px] truncate" title={item.local}>
                        {item.local}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {item.disciplina}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.descricao}>
                        {item.descricao}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(item.quantidade)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {formatValue(item.valorUnitario)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {item.hasCalculationError ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-destructive cursor-help underline decoration-dashed">
                                {formatValue(item.valorTotal)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-1 text-sm">
                                <p className="font-semibold text-destructive">Erro de Cálculo!</p>
                                <p>Informado: {formatValue(item.valorTotal)}</p>
                                <p>Calculado: {formatValue(item.calculatedValue || 0)}</p>
                                <p>Diferença: {formatValue(item.errorDifference || 0)} ({item.errorPercent?.toFixed(2)}%)</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatNumber(item.quantidade)} × {formatValue(item.valorUnitario)} = {formatValue(item.calculatedValue || 0)}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          formatValue(item.valorTotal)
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.hasCalculationError ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Erro
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              Qtd × P.U. ≠ Valor Total
                            </TooltipContent>
                          </Tooltip>
                        ) : item.status === 'outlier' ? (
                          <Badge variant="outline" className="border-warning text-warning gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Outlier
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-success text-success gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            OK
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Exibindo {sortedData.length} de {data.length} registros
          {errorCount > 0 && (
            <span className="text-destructive ml-2">• {errorCount} com erro de cálculo</span>
          )}
        </p>
      </CardContent>
    </Card>
  );
};
