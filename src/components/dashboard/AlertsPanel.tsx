import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, formatCurrency } from '@/lib/analytics';
import { AlertTriangle, AlertCircle, TrendingDown, Calculator, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertsPanelProps {
  alerts: Alert[];
  onAlertClick?: (alert: Alert) => void;
}

export const AlertsPanel = ({ alerts, onAlertClick }: AlertsPanelProps) => {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error': return Calculator;
      case 'outlier': return AlertTriangle;
      case 'deviation': return TrendingDown;
      default: return AlertCircle;
    }
  };

  const getSeverityStyles = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10';
      case 'medium':
        return 'border-warning/30 bg-warning/5 hover:bg-warning/10';
      default:
        return 'border-muted hover:bg-muted/50';
    }
  };

  const getSeverityBadge = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive" className="text-[10px] px-1.5">Alto</Badge>;
      case 'medium':
        return <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5">Médio</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] px-1.5">Baixo</Badge>;
    }
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-success" />
            Central de Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground gap-2">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-success" />
            </div>
            <p className="text-sm font-medium text-success">Nenhum alerta detectado</p>
            <p className="text-xs text-muted-foreground">Dados dentro do padrão esperado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const highCount = alerts.filter(a => a.severity === 'high').length;
  const mediumCount = alerts.filter(a => a.severity === 'medium').length;

  return (
    <Card className="border-destructive/20 h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Central de Alertas
          </CardTitle>
          <div className="flex items-center gap-2 text-xs">
            {highCount > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {highCount} crítico{highCount > 1 ? 's' : ''}
              </Badge>
            )}
            {mediumCount > 0 && (
              <Badge className="bg-warning text-warning-foreground text-[10px]">
                {mediumCount} atenção
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1 min-h-0">
        <ScrollArea className="h-full max-h-[300px] pr-3">
          <div className="space-y-2">
            {alerts.slice(0, 10).map((alert) => {
              const Icon = getAlertIcon(alert.type);
              
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-all group',
                    getSeverityStyles(alert.severity)
                  )}
                  onClick={() => onAlertClick?.(alert)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'p-1.5 rounded-md shrink-0',
                      alert.severity === 'high' ? 'bg-destructive/20' : 
                      alert.severity === 'medium' ? 'bg-warning/20' : 'bg-muted'
                    )}>
                      <Icon className={cn(
                        'h-3.5 w-3.5',
                        alert.severity === 'high' ? 'text-destructive' : 
                        alert.severity === 'medium' ? 'text-warning' : 'text-muted-foreground'
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-medium text-foreground break-words">
                          {alert.title}
                        </span>
                        {getSeverityBadge(alert.severity)}
                      </div>
                      <p className="text-xs text-muted-foreground break-words">
                        {alert.description}
                      </p>
                      {alert.value && alert.expectedValue && (
                        <div className="flex items-center gap-2 mt-1.5 text-xs flex-wrap">
                          <span className="text-destructive whitespace-nowrap">
                            Informado: {formatCurrency(alert.value)}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-success whitespace-nowrap">
                            Esperado: {formatCurrency(alert.expectedValue)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {alerts.length > 10 && (
          <p className="text-xs text-center text-muted-foreground pt-3 border-t border-border mt-3">
            +{alerts.length - 10} outros alertas
          </p>
        )}
      </CardContent>
    </Card>
  );
};
