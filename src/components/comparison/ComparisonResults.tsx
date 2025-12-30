import { ComparisonResult, ComparisonItem } from '@/types/comparison';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus, Plus, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@/lib/analytics';
import { formatVariation, getStatusLabel, getStatusBadgeVariant } from '@/lib/comparisonUtils';

interface ComparisonResultsProps {
  result: ComparisonResult;
  onClose?: () => void;
}

export const ComparisonResults = ({ result, onClose }: ComparisonResultsProps) => {
  const { resumo, items, nomeBase, nomeComparacao, tipo } = result;
  
  const getStatusIcon = (status: ComparisonItem['status']) => {
    switch (status) {
      case 'novo': return <Plus className="h-4 w-4" />;
      case 'removido': return <X className="h-4 w-4" />;
      case 'aumentou': return <TrendingUp className="h-4 w-4" />;
      case 'diminuiu': return <TrendingDown className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const getVariationColor = (value: number | undefined) => {
    if (value === undefined) return 'text-muted-foreground';
    if (Math.abs(value) < 0.5) return 'text-muted-foreground';
    return value > 0 ? 'text-warning' : 'text-success';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Base</p>
            <p className="text-lg font-semibold">{resumo.totalItensBase}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Comparação</p>
            <p className="text-lg font-semibold">{resumo.totalItensComparacao}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-1">
              <Plus className="h-3 w-3 text-primary" />
              <p className="text-xs text-muted-foreground">Novos</p>
            </div>
            <p className="text-lg font-semibold text-primary">{resumo.itensNovos}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-1">
              <X className="h-3 w-3 text-destructive" />
              <p className="text-xs text-muted-foreground">Removidos</p>
            </div>
            <p className="text-lg font-semibold text-destructive">{resumo.itensRemovidos}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-warning" />
              <p className="text-xs text-muted-foreground">Aumentaram</p>
            </div>
            <p className="text-lg font-semibold text-warning">{resumo.itensAumentaram}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3 text-success" />
              <p className="text-xs text-muted-foreground">Diminuíram</p>
            </div>
            <p className="text-lg font-semibold text-success">{resumo.itensDiminuiram}</p>
          </CardContent>
        </Card>
      </div>

      {/* Variation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Valor Total Base</p>
            <p className="text-xl font-bold">{formatCurrency(resumo.valorTotalBase)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Valor Total Comparação</p>
            <p className="text-xl font-bold">{formatCurrency(resumo.valorTotalComparacao)}</p>
          </CardContent>
        </Card>
        
        <Card className={resumo.variacaoTotalGeral >= 0 ? 'bg-warning/5 border-warning/20' : 'bg-success/5 border-success/20'}>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Variação Geral</p>
            <div className="flex items-center gap-2">
              {resumo.variacaoTotalGeral >= 0 ? (
                <TrendingUp className="h-5 w-5 text-warning" />
              ) : (
                <TrendingDown className="h-5 w-5 text-success" />
              )}
              <p className={`text-xl font-bold ${resumo.variacaoTotalGeral >= 0 ? 'text-warning' : 'text-success'}`}>
                {formatVariation(resumo.variacaoTotalGeral)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Highlights */}
      {(resumo.maiorAumento || resumo.maiorReducao) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumo.maiorAumento && (
            <Card className="border-warning/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-warning">
                  <TrendingUp className="h-4 w-4" />
                  Maior Aumento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium truncate">{resumo.maiorAumento.descricao}</p>
                <p className="text-xs text-muted-foreground font-mono">{resumo.maiorAumento.codigo}</p>
                <p className="text-lg font-bold text-warning mt-1">
                  {formatVariation(resumo.maiorAumento.variacaoPreco || resumo.maiorAumento.variacaoTotal)}
                </p>
              </CardContent>
            </Card>
          )}
          
          {resumo.maiorReducao && (
            <Card className="border-success/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-success">
                  <TrendingDown className="h-4 w-4" />
                  Maior Redução
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium truncate">{resumo.maiorReducao.descricao}</p>
                <p className="text-xs text-muted-foreground font-mono">{resumo.maiorReducao.codigo}</p>
                <p className="text-lg font-bold text-success mt-1">
                  {formatVariation(resumo.maiorReducao.variacaoPreco || resumo.maiorReducao.variacaoTotal)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Comparação Detalhada</span>
            <span className="text-sm font-normal text-muted-foreground">
              {items.length} itens
            </span>
          </CardTitle>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{nomeBase}</span>
            <span>vs</span>
            <span className="font-medium text-foreground">{nomeComparacao}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[60px]">Un</TableHead>
                  {tipo === 'medicao' && (
                    <>
                      <TableHead className="text-right w-[100px]">Qtd Base</TableHead>
                      <TableHead className="text-right w-[100px]">Qtd Atual</TableHead>
                    </>
                  )}
                  <TableHead className="text-right w-[120px]">Valor Base</TableHead>
                  <TableHead className="text-right w-[120px]">Valor Atual</TableHead>
                  <TableHead className="text-right w-[100px]">Variação</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{item.descricao}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.unidade || '-'}</TableCell>
                    {tipo === 'medicao' && (
                      <>
                        <TableCell className="text-right text-sm">
                          {item.quantidadeBase?.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) || '-'}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {item.quantidadeComparacao?.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) || '-'}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-right text-sm">
                      {item.valorBase !== undefined ? formatCurrency(item.valorBase) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {item.valorComparacao !== undefined ? formatCurrency(item.valorComparacao) : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${getVariationColor(item.variacaoPreco || item.variacaoTotal)}`}>
                      {formatVariation(item.variacaoPreco || item.variacaoTotal)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(item.status)} className="gap-1 text-xs">
                        {getStatusIcon(item.status)}
                        {getStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
