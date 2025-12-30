import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceDot, CartesianGrid } from 'recharts';
import { MeasurementEntry } from '@/types/measurement';
import { getDisciplineStats, formatCurrency } from '@/lib/analytics';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface SmartEvolutionChartProps {
  data: MeasurementEntry[];
}

const chartConfig = {
  value: { label: 'Valor', color: 'hsl(var(--chart-1))' },
  Hidráulica: { label: 'Hidráulica', color: 'hsl(var(--chart-1))' },
  Elétrica: { label: 'Elétrica', color: 'hsl(var(--chart-2))' },
  Civil: { label: 'Civil', color: 'hsl(var(--chart-3))' },
  Estrutural: { label: 'Estrutural', color: 'hsl(var(--chart-4))' },
  Acabamento: { label: 'Acabamento', color: 'hsl(var(--chart-5))' },
};

export const SmartEvolutionChart = ({ data }: SmartEvolutionChartProps) => {
  if (!data || data.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Evolução por Disciplina
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-3">
            <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm">Importe uma planilha para visualizar a evolução</p>
            <p className="text-xs text-muted-foreground/70">A IA irá analisar tendências automaticamente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const disciplineStats = getDisciplineStats(data);
  
  // Create chart data by aggregating periods
  const allDates = [...new Set(data.map(d => d.date))].sort();
  const chartData = allDates.map((date, idx) => {
    const point: any = { 
      period: `M${idx + 1}`,
      date,
      displayDate: new Date(date).toLocaleDateString('pt-BR', { month: 'short' })
    };
    
    disciplineStats.forEach(ds => {
      const items = data.filter(d => d.date === date && d.disciplina === ds.disciplina);
      const value = items.reduce((sum, i) => sum + i.valorTotal, 0);
      point[ds.disciplina] = value;
      
      // Check for outliers
      const hasError = items.some(item => {
        const calc = item.quantidade * item.valorUnitario;
        return Math.abs(calc - item.valorTotal) > 0.01 && item.valorTotal > 0;
      });
      point[`${ds.disciplina}_outlier`] = hasError;
    });
    
    return point;
  });

  // Find outlier points for highlighting
  const outlierPoints: { x: string; y: number; discipline: string }[] = [];
  chartData.forEach(point => {
    disciplineStats.forEach(ds => {
      if (point[`${ds.disciplina}_outlier`] && point[ds.disciplina] > 0) {
        outlierPoints.push({
          x: point.period,
          y: point[ds.disciplina],
          discipline: ds.disciplina
        });
      }
    });
  });

  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Evolução por Disciplina
          </CardTitle>
          {outlierPoints.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-warning">
              <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              {outlierPoints.length} ponto{outlierPoints.length > 1 ? 's' : ''} atípico{outlierPoints.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {disciplineStats.map((ds, idx) => (
                  <linearGradient key={ds.disciplina} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors[idx % colors.length]} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={colors[idx % colors.length]} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="period" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatCurrency(value)}
                width={65}
              />
              <ChartTooltip 
                content={<ChartTooltipContent 
                  formatter={(value, name) => [formatCurrency(Number(value)), name]}
                />} 
              />
              {disciplineStats.slice(0, 5).map((ds, idx) => (
                <Area
                  key={ds.disciplina}
                  type="monotone"
                  dataKey={ds.disciplina}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                  fill={`url(#gradient-${idx})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              ))}
              {/* Highlight outlier points */}
              {outlierPoints.map((point, idx) => (
                <ReferenceDot
                  key={`outlier-${idx}`}
                  x={point.x}
                  y={point.y}
                  r={6}
                  fill="hsl(var(--warning))"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {disciplineStats.slice(0, 5).map((ds, idx) => (
            <div key={ds.disciplina} className="flex items-center gap-1.5 text-xs">
              <span 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: colors[idx % colors.length] }}
              />
              <span className="text-muted-foreground">{ds.disciplina}</span>
              {ds.riskLevel !== 'low' && (
                <span className={`w-1.5 h-1.5 rounded-full ${
                  ds.riskLevel === 'high' ? 'bg-destructive' : 'bg-warning'
                }`} />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
