import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MeasurementEntry } from '@/types/measurement';

interface EvolutionChartProps {
  data: MeasurementEntry[];
}

export const EvolutionChart = ({ data }: EvolutionChartProps) => {
  // Handle empty data gracefully
  if (!data || data.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Evolução por Disciplina</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            Importe uma planilha para visualizar a evolução
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by discipline and date
  const chartData = data.reduce((acc, item) => {
    const date = item.date;
    const existing = acc.find(d => d.date === date);
    
    if (existing) {
      existing[item.disciplina] = (existing[item.disciplina] || 0) + item.valorTotal;
      existing.total = (existing.total || 0) + item.valorTotal;
    } else {
      acc.push({
        date,
        [item.disciplina]: item.valorTotal,
        total: item.valorTotal
      });
    }
    
    return acc;
  }, [] as Record<string, any>[]).sort((a, b) => a.date.localeCompare(b.date));

  const disciplines = [...new Set(data.map(d => d.disciplina))];
  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
  ];

  const formatValue = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
    return `R$ ${value.toFixed(0)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Evolução por Disciplina</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={formatValue}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                formatter={(value: number) => formatValue(value)}
                labelFormatter={formatDate}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              {disciplines.map((discipline, index) => (
                <Bar
                  key={discipline}
                  dataKey={discipline}
                  stackId="a"
                  fill={colors[index % colors.length]}
                  radius={index === disciplines.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
