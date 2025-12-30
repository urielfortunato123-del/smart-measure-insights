import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MeasurementEntry } from '@/types/measurement';
import { getDisciplineStats, formatCurrency } from '@/lib/analytics';
import { PieChart, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartCompositionChartProps {
  data: MeasurementEntry[];
}

export const SmartCompositionChart = ({ data }: SmartCompositionChartProps) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" />
            Composição por Atividade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-3">
            <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm">Importe uma planilha para ver a composição</p>
            <p className="text-xs text-muted-foreground/70">Ranking de atividades com análise de risco</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const disciplineStats = getDisciplineStats(data);
  const totalValue = disciplineStats.reduce((sum, ds) => sum + ds.totalValue, 0);

  // Color mapping based on risk
  const getRiskColors = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high':
        return {
          bg: 'bg-destructive/10',
          bar: 'bg-destructive',
          text: 'text-destructive',
          icon: AlertTriangle
        };
      case 'medium':
        return {
          bg: 'bg-warning/10',
          bar: 'bg-warning',
          text: 'text-warning',
          icon: AlertCircle
        };
      default:
        return {
          bg: 'bg-success/10',
          bar: 'bg-success',
          text: 'text-success',
          icon: CheckCircle
        };
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" />
            Composição por Atividade
          </CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success" />
              OK
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-warning" />
              Atenção
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              Risco
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {disciplineStats.slice(0, 6).map((ds, idx) => {
          const percentage = (ds.totalValue / totalValue) * 100;
          const colors = getRiskColors(ds.riskLevel);
          const RiskIcon = colors.icon;
          
          return (
            <div 
              key={ds.disciplina} 
              className={cn(
                'rounded-lg p-3 transition-all hover:scale-[1.02]',
                colors.bg
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-5">
                    #{idx + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {ds.disciplina}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {formatCurrency(ds.totalValue)}
                  </span>
                  <RiskIcon className={cn('h-3.5 w-3.5', colors.text)} />
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-500', colors.bar)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                <span>{percentage.toFixed(1)}% do total</span>
                <span>{ds.measurements.length} medição(ões)</span>
              </div>
            </div>
          );
        })}
        
        {disciplineStats.length > 6 && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            +{disciplineStats.length - 6} outras disciplinas
          </p>
        )}
      </CardContent>
    </Card>
  );
};
