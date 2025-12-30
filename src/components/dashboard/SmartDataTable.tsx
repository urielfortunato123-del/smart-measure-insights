import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, AlertTriangle, ChevronUp, ChevronDown, Download, AlertCircle, 
  CheckCircle2, FileSpreadsheet, History, TrendingUp, Info, Eye
} from 'lucide-react';
import { MeasurementEntry } from '@/types/measurement';
import { exportToExcel } from '@/lib/excelParser';
import { getItemHistory, formatCurrency, formatNumber } from '@/lib/analytics';
import { ChartContainer } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface SmartDataTableProps {
  data: MeasurementEntry[];
}

type SortField = 'date' | 'valorTotal' | 'quantidade';
type SortDirection = 'asc' | 'desc';

export const SmartDataTable = ({ data }: SmartDataTableProps) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

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

  const handleExportCorrected = () => {
    const correctedData = processedData.map(item => ({
      ...item,
      valorTotal: item.calculatedValue || item.valorTotal,
      status: 'normal' as const
    }));
    exportToExcel(correctedData, `medicao_corrigida_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Item history dialog
  const itemHistory = selectedItem ? getItemHistory(data, selectedItem) : null;

  return (
    <>
      <Card className="col-span-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Navegador de Dados
            </CardTitle>
            {errorCount > 0 && (
              <Badge variant="destructive" className="gap-1 text-xs">
                <AlertCircle className="h-3 w-3" />
                {errorCount} erro{errorCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary/50 h-8 text-sm"
              />
            </div>
            {errorCount > 0 && (
              <Button 
                variant={showOnlyErrors ? "default" : "outline"} 
                size="sm" 
                onClick={() => setShowOnlyErrors(!showOnlyErrors)}
                className="h-8 text-xs"
              >
                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                Erros
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExport} className="h-8 text-xs">
              <Download className="h-3.5 w-3.5 mr-1" />
              Exportar
            </Button>
            {errorCount > 0 && (
              <Button variant="default" size="sm" onClick={handleExportCorrected} className="h-8 text-xs">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                Corrigida
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="max-h-[350px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead 
                      className="cursor-pointer hover:text-foreground transition-colors text-xs"
                      onClick={() => handleSort('date')}
                    >
                      Data <SortIcon field="date" />
                    </TableHead>
                    <TableHead className="text-xs">Disciplina</TableHead>
                    <TableHead className="max-w-[200px] text-xs">Descrição</TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:text-foreground transition-colors text-xs"
                      onClick={() => handleSort('quantidade')}
                    >
                      Qtd <SortIcon field="quantidade" />
                    </TableHead>
                    <TableHead className="text-right text-xs">P.U.</TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:text-foreground transition-colors text-xs"
                      onClick={() => handleSort('valorTotal')}
                    >
                      Total <SortIcon field="valorTotal" />
                    </TableHead>
                    <TableHead className="text-center text-xs">Status</TableHead>
                    <TableHead className="text-center text-xs w-10">
                      <Eye className="h-3.5 w-3.5 mx-auto" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                        {data.length === 0 ? (
                          <div className="flex flex-col items-center gap-2">
                            <FileSpreadsheet className="h-8 w-8 text-muted-foreground/50" />
                            <span>Importe uma planilha para visualizar os dados</span>
                            <span className="text-xs">A IA fará a análise automaticamente</span>
                          </div>
                        ) : 'Nenhum resultado encontrado'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedData.map((item) => (
                      <TableRow 
                        key={item.id} 
                        className={`border-border ${
                          item.hasCalculationError 
                            ? 'bg-destructive/5 hover:bg-destructive/10' 
                            : item.status === 'outlier' 
                              ? 'bg-warning/5' 
                              : ''
                        }`}
                      >
                        <TableCell className="font-medium text-sm">{formatDate(item.date)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal text-xs">
                            {item.disciplina}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm" title={item.descricao}>
                          {item.descricao}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNumber(item.quantidade)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground text-sm">
                          {formatCurrency(item.valorUnitario)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-sm">
                          {item.hasCalculationError ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-destructive cursor-help underline decoration-dashed">
                                  {formatCurrency(item.valorTotal)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="space-y-1 text-sm">
                                  <p className="font-semibold text-destructive">Erro de Cálculo Detectado</p>
                                  <p>Informado: {formatCurrency(item.valorTotal)}</p>
                                  <p>Calculado: {formatCurrency(item.calculatedValue || 0)}</p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    A IA detectou uma diferença de {item.errorPercent?.toFixed(1)}%
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            formatCurrency(item.valorTotal)
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.hasCalculationError ? (
                            <Badge variant="destructive" className="gap-1 text-[10px]">
                              <AlertCircle className="h-2.5 w-2.5" />
                              Erro
                            </Badge>
                          ) : item.status === 'outlier' ? (
                            <Badge variant="outline" className="border-warning text-warning gap-1 text-[10px]">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Outlier
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-success text-success gap-1 text-[10px]">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              OK
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setSelectedItem(item.descricao)}
                          >
                            <History className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted-foreground">
              Exibindo {sortedData.length} de {data.length} registros
              {errorCount > 0 && (
                <span className="text-destructive ml-2">• {errorCount} com erro</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              Clique no ícone de histórico para ver a evolução do item
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Item History Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Histórico do Item
            </DialogTitle>
          </DialogHeader>
          
          {itemHistory ? (
            <div className="space-y-4">
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-sm font-medium">{itemHistory.descricao}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Disciplina: {itemHistory.disciplina}
                </p>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold">{itemHistory.measurements.length}</p>
                  <p className="text-xs text-muted-foreground">Medições</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold">{formatCurrency(itemHistory.avgValorTotal)}</p>
                  <p className="text-xs text-muted-foreground">Média</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold">{itemHistory.divergenceCount}</p>
                  <p className="text-xs text-muted-foreground">Divergências</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className={`text-lg font-bold ${
                    itemHistory.trend === 'worsening' ? 'text-destructive' :
                    itemHistory.trend === 'improving' ? 'text-success' : ''
                  }`}>
                    {itemHistory.trend === 'worsening' ? '↓' : itemHistory.trend === 'improving' ? '↑' : '→'}
                  </p>
                  <p className="text-xs text-muted-foreground">Tendência</p>
                </div>
              </div>
              
              {/* Mini chart */}
              {itemHistory.measurements.length > 1 && (
                <div className="h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={itemHistory.measurements}>
                      <XAxis 
                        dataKey="period" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        tickFormatter={(v) => `M${v}`}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        tickFormatter={(v) => formatCurrency(v)}
                        width={70}
                      />
                      <RechartsTooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Valor']}
                        labelFormatter={(label) => `Medição ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="valorTotal" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={(props) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={payload.hasError ? 6 : 4}
                              fill={payload.hasError ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                              stroke="hsl(var(--background))"
                              strokeWidth={2}
                            />
                          );
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              {/* AI Insight */}
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    {itemHistory.divergenceFrequency > 30 
                      ? `Este item apresenta histórico de divergência em ${itemHistory.divergenceFrequency.toFixed(0)}% das medições. Recomenda-se atenção especial na verificação.`
                      : itemHistory.lastDeviation > 15
                        ? `O último valor está ${Math.abs(itemHistory.lastDeviation).toFixed(1)}% ${itemHistory.lastDeviation > 0 ? 'acima' : 'abaixo'} da média histórica.`
                        : 'Este item está dentro do padrão histórico esperado.'
                    }
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum histórico disponível para este item
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
