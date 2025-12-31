import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info, Lightbulb, CheckCircle } from 'lucide-react';
import { CellError } from '@/pages/Analise';

interface ErrorDetailModalProps {
  error: CellError | null;
  cellValue: any;
  onClose: () => void;
}

const getErrorConfig = (error: CellError) => {
  switch (error.type) {
    case 'calculation':
      return {
        icon: AlertCircle,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        label: 'Erro de Cálculo',
        explanation: 'A fórmula ou cálculo nesta célula pode estar incorreto. O valor total não corresponde à multiplicação de quantidade × valor unitário.',
        suggestions: [
          'Verifique se a quantidade está correta',
          'Confirme o valor unitário',
          'Recalcule o valor total manualmente',
          'Compare com itens similares na planilha'
        ]
      };
    case 'inconsistent':
      return {
        icon: AlertTriangle,
        color: 'text-amber-600',
        bgColor: 'bg-amber-500/10',
        label: 'Valor Inconsistente',
        explanation: 'O valor desta célula parece estar fora do padrão esperado quando comparado com outros dados similares na planilha.',
        suggestions: [
          'Compare com valores de itens similares',
          'Verifique se a unidade está correta',
          'Confirme se o valor não foi digitado incorretamente',
          'Consulte a tabela de referência (TPU/SINAPI)'
        ]
      };
    case 'duplicate':
      return {
        icon: Info,
        color: 'text-orange-600',
        bgColor: 'bg-orange-500/10',
        label: 'Duplicata Detectada',
        explanation: 'Este item pode estar duplicado na planilha. Verifique se não há lançamento repetido.',
        suggestions: [
          'Verifique se o item foi lançado mais de uma vez',
          'Confirme se são serviços diferentes',
          'Remova duplicatas se necessário',
          'Agrupe itens similares se apropriado'
        ]
      };
    case 'missing':
      return {
        icon: Info,
        color: 'text-blue-600',
        bgColor: 'bg-blue-500/10',
        label: 'Dado Faltante',
        explanation: 'Esta célula está vazia ou contém dados incompletos que podem afetar a análise.',
        suggestions: [
          'Preencha o campo com o valor correto',
          'Verifique se o dado está disponível em outra fonte',
          'Consulte o responsável pelo lançamento',
          'Marque como N/A se não aplicável'
        ]
      };
  }
};

export const ErrorDetailModal = ({ error, cellValue, onClose }: ErrorDetailModalProps) => {
  if (!error) return null;

  const config = getErrorConfig(error);
  const Icon = config.icon;

  return (
    <Dialog open={!!error} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <span className="text-card-foreground">{config.label}</span>
            <Badge variant={error.severity === 'error' ? 'destructive' : 'secondary'}>
              {error.severity === 'error' ? 'Crítico' : error.severity === 'warning' ? 'Atenção' : 'Info'}
            </Badge>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes do erro encontrado na célula
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Localização */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-card-foreground/70 mb-1">Localização</p>
            <p className="text-sm font-medium text-card-foreground">
              Linha {error.row + 1}, Coluna {error.col + 1}
            </p>
            {cellValue !== undefined && cellValue !== null && cellValue !== '' && (
              <p className="text-sm text-card-foreground/70 mt-1">
                Valor atual: <span className="font-mono bg-card px-1 rounded">{String(cellValue)}</span>
              </p>
            )}
          </div>

          {/* Descrição do erro */}
          <div>
            <p className="text-sm font-medium text-card-foreground mb-2">O que aconteceu?</p>
            <p className="text-sm text-card-foreground/80">{error.message}</p>
          </div>

          {/* Explicação */}
          <div className={`p-3 rounded-lg ${config.bgColor}`}>
            <p className="text-sm text-card-foreground/90">{config.explanation}</p>
          </div>

          {/* Sugestões */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-medium text-card-foreground">O que fazer?</p>
            </div>
            <ul className="space-y-2">
              {config.suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-card-foreground/80">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onClose}>
              Entendi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
