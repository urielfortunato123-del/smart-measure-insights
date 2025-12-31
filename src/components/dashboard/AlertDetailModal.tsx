import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, formatCurrency } from '@/lib/analytics';
import { MeasurementEntry } from '@/types/measurement';
import { 
  AlertTriangle, 
  Calculator, 
  TrendingDown, 
  AlertCircle,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowRight,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AlertDetailModalProps {
  alert: Alert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relatedItem?: MeasurementEntry;
  allData?: MeasurementEntry[];
}

export const AlertDetailModal = ({ 
  alert, 
  open, 
  onOpenChange,
  relatedItem,
  allData = []
}: AlertDetailModalProps) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && alert && !aiAnalysis) {
      analyzeWithAI();
    }
  }, [open, alert]);

  const analyzeWithAI = async () => {
    if (!alert) return;

    setIsAnalyzing(true);
    try {
      const context = relatedItem ? [relatedItem] : allData.slice(0, 20);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-measurement`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content: `Analise este alerta específico e forneça uma recomendação detalhada:

Tipo de Alerta: ${alert.type}
Título: ${alert.title}
Descrição: ${alert.description}
Severidade: ${alert.severity}
${alert.value ? `Valor Informado: R$ ${alert.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
${alert.expectedValue ? `Valor Esperado: R$ ${alert.expectedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}

${relatedItem ? `
Item Relacionado:
- Descrição: ${relatedItem.descricao}
- Quantidade: ${relatedItem.quantidade} ${relatedItem.unidade}
- Valor Unitário: R$ ${relatedItem.valorUnitario}
- Valor Total: R$ ${relatedItem.valorTotal}
- Disciplina: ${relatedItem.disciplina}
- Local: ${relatedItem.local}
` : ''}

Por favor forneça:
1. Análise do problema detectado
2. Possíveis causas
3. Ações corretivas recomendadas
4. Impacto se não corrigido

Seja objetivo e técnico.`
              }
            ],
            data: context,
            action: 'analyze_errors'
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao analisar');
      }

      // Read the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  result += content;
                  setAiAnalysis(result);
                }
              } catch {}
            }
          }
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      setAiAnalysis('Não foi possível gerar a análise automática. Verifique manualmente os dados do item.');
      toast({
        title: 'Erro na análise',
        description: 'Não foi possível conectar com a IA',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error': return Calculator;
      case 'outlier': return AlertTriangle;
      case 'deviation': return TrendingDown;
      default: return AlertCircle;
    }
  };

  const getAlertTypeLabel = (type: Alert['type']) => {
    switch (type) {
      case 'error': return 'Erro de Cálculo';
      case 'outlier': return 'Valor Atípico';
      case 'deviation': return 'Desvio Histórico';
      default: return 'Alerta';
    }
  };

  const getSeverityStyles = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30' };
      case 'medium':
        return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' };
      default:
        return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' };
    }
  };

  if (!alert) return null;

  const Icon = getAlertIcon(alert.type);
  const styles = getSeverityStyles(alert.severity);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        setAiAnalysis('');
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="shrink-0 p-6 pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', styles.bg)}>
              <Icon className={cn('h-5 w-5', styles.text)} />
            </div>
            <div>
              <span className="text-lg">{alert.title}</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn('text-xs', styles.border, styles.text)}>
                  {getAlertTypeLabel(alert.type)}
                </Badge>
                <Badge 
                  variant={alert.severity === 'high' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {alert.severity === 'high' ? 'Crítico' : alert.severity === 'medium' ? 'Atenção' : 'Baixo'}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto px-6">
          <div className="space-y-6 pb-6">
          {/* Alert Details */}
          <div className={cn('p-4 rounded-lg border', styles.border, styles.bg)}>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descrição do Problema
            </h4>
            <p className="text-sm text-muted-foreground">
              {alert.description}
            </p>
            
            {/* Values comparison */}
            {alert.value !== undefined && alert.expectedValue !== undefined && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-xs font-medium text-destructive">Valor Informado</span>
                  </div>
                  <p className="text-lg font-bold text-destructive">
                    {formatCurrency(alert.value)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-xs font-medium text-success">Valor Correto</span>
                  </div>
                  <p className="text-lg font-bold text-success">
                    {formatCurrency(alert.expectedValue)}
                  </p>
                </div>
              </div>
            )}
            
            {alert.value !== undefined && alert.expectedValue !== undefined && (
              <div className="mt-3 p-2 rounded bg-muted/50 text-center">
                <span className="text-xs text-muted-foreground">Diferença: </span>
                <span className="text-sm font-semibold text-destructive">
                  {formatCurrency(Math.abs(alert.value - alert.expectedValue))}
                </span>
              </div>
            )}
          </div>

          {/* Related Item Details */}
          {relatedItem && (
            <div className="p-4 rounded-lg border border-border bg-card">
              <h4 className="text-sm font-semibold mb-3">Dados do Item</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Descrição</span>
                  <p className="font-medium">{relatedItem.descricao}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Disciplina</span>
                  <p className="font-medium">{relatedItem.disciplina}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Quantidade</span>
                  <p className="font-medium">{relatedItem.quantidade} {relatedItem.unidade}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Valor Unitário</span>
                  <p className="font-medium">{formatCurrency(relatedItem.valorUnitario)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Valor Total</span>
                  <p className="font-medium">{formatCurrency(relatedItem.valorTotal)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Local</span>
                  <p className="font-medium">{relatedItem.local}</p>
                </div>
              </div>
              
              {/* Show calculation check */}
              <div className="mt-3 p-2 rounded bg-muted/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Verificação: {relatedItem.quantidade} × {formatCurrency(relatedItem.valorUnitario)}</span>
                  <span className="flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    <span className="font-medium">{formatCurrency(relatedItem.quantidade * relatedItem.valorUnitario)}</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* AI Analysis */}
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Análise e Recomendações da IA
            </h4>
            
            {isAnalyzing ? (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Analisando dados...</span>
              </div>
            ) : (
              <ScrollArea className="max-h-[250px]">
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed pr-4">
                  {aiAnalysis || 'Clique em "Analisar Novamente" para obter recomendações da IA.'}
                </div>
              </ScrollArea>
            )}
            
            {!isAnalyzing && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={analyzeWithAI}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Analisar Novamente
              </Button>
            )}
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};