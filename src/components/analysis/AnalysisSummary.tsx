import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  AlertTriangle, 
  AlertCircle, 
  Copy, 
  Database,
  CheckCircle2,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { AnalysisResult } from '@/pages/Analise';
import { cn } from '@/lib/utils';

interface AnalysisSummaryProps {
  result: AnalysisResult | null;
  isAnalyzing: boolean;
  onReanalyze: () => void;
}

export const AnalysisSummary = ({ result, isAnalyzing, onReanalyze }: AnalysisSummaryProps) => {
  if (isAnalyzing) {
    return (
      <Card className="overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
        <CardContent className="relative p-6 flex flex-col items-center justify-center min-h-[300px]">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-primary/10 rounded-full p-4 animate-spin">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mt-6">Analisando com IA...</h3>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Verificando erros de cálculo, inconsistências, duplicatas e dados faltantes
          </p>
          <div className="w-full mt-6 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Processando...</span>
              <Loader2 className="h-3 w-3 animate-spin" />
            </div>
            <Progress value={66} className="h-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
          <div className="bg-muted rounded-full p-4">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mt-4">Análise Inteligente</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Clique em "Analisar com IA" para detectar erros automaticamente
          </p>
        </CardContent>
      </Card>
    );
  }

  const { summary } = result;
  const errorRate = summary.totalRows > 0 
    ? Math.round((summary.totalErrors / summary.totalRows) * 100) 
    : 0;

  const categories = [
    { 
      label: 'Erros de Cálculo', 
      count: summary.calculationErrors, 
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    { 
      label: 'Valores Inconsistentes', 
      count: summary.inconsistentValues, 
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    { 
      label: 'Duplicatas', 
      count: summary.duplicates, 
      icon: Copy,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    { 
      label: 'Dados Faltantes', 
      count: summary.missingData, 
      icon: Database,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Resultado da Análise
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onReanalyze}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Score Card */}
        <div className={cn(
          "rounded-lg p-4 text-center",
          summary.totalErrors === 0 ? "bg-green-500/10" : "bg-destructive/10"
        )}>
          {summary.totalErrors === 0 ? (
            <>
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
              <p className="text-lg font-semibold mt-2 text-green-600">Sem Erros!</p>
              <p className="text-xs text-muted-foreground">Planilha validada com sucesso</p>
            </>
          ) : (
            <>
              <div className="text-3xl font-bold text-destructive">{summary.totalErrors}</div>
              <p className="text-sm font-medium">Problemas Encontrados</p>
              <p className="text-xs text-muted-foreground mt-1">
                {errorRate}% das linhas com erro
              </p>
            </>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="space-y-2">
          {categories.map((cat, i) => (
            <div 
              key={i} 
              className={cn(
                "flex items-center justify-between p-2 rounded-md transition-colors",
                cat.count > 0 ? cat.bgColor : "bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2">
                <cat.icon className={cn("h-4 w-4", cat.count > 0 ? cat.color : "text-muted-foreground")} />
                <span className="text-xs">{cat.label}</span>
              </div>
              <Badge 
                variant={cat.count > 0 ? "default" : "secondary"} 
                className="text-xs px-2"
              >
                {cat.count}
              </Badge>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Total de linhas</span>
            <span className="font-medium">{summary.totalRows}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
