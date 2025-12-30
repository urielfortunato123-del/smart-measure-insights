import { useState, useMemo, useCallback } from 'react';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { SmartKPICard } from '@/components/dashboard/SmartKPICard';
import { SmartEvolutionChart } from '@/components/dashboard/SmartEvolutionChart';
import { SmartCompositionChart } from '@/components/dashboard/SmartCompositionChart';
import { SmartDataTable } from '@/components/dashboard/SmartDataTable';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getUniqueValues } from '@/data/sampleData';
import { MeasurementEntry, FilterState } from '@/types/measurement';
import { calculateSmartStats, generateAlerts, formatCurrency, formatNumber } from '@/lib/analytics';
import { Ruler, DollarSign, FileText, AlertTriangle } from 'lucide-react';

const Index = () => {
  const [data, setData] = useState<MeasurementEntry[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [filters, setFilters] = useState<FilterState>({
    responsavel: [],
    local: [],
    disciplina: [],
    dateRange: null
  });

  const responsaveis = useMemo(() => getUniqueValues(data, 'responsavel'), [data]);
  const locais = useMemo(() => getUniqueValues(data, 'local'), [data]);
  const disciplinas = useMemo(() => getUniqueValues(data, 'disciplina'), [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filters.responsavel.length > 0 && !filters.responsavel.includes(item.responsavel)) return false;
      if (filters.local.length > 0 && !filters.local.includes(item.local)) return false;
      if (filters.disciplina.length > 0 && !filters.disciplina.includes(item.disciplina)) return false;
      return true;
    });
  }, [data, filters]);

  const stats = useMemo(() => calculateSmartStats(filteredData), [filteredData]);
  const alerts = useMemo(() => generateAlerts(filteredData), [filteredData]);

  const handleDataLoaded = useCallback((newData: MeasurementEntry[]) => {
    if (newData.length > 0) setData(newData);
    setLastUpdate(new Date());
  }, []);

  const handleAddEntry = useCallback((entry: MeasurementEntry) => {
    setData(prev => [...prev, entry]);
    setLastUpdate(new Date());
  }, []);

  const handleRefresh = useCallback(() => setLastUpdate(new Date()), []);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar
        onDataLoaded={handleDataLoaded}
        onAddEntry={handleAddEntry}
        filters={filters}
        onFiltersChange={setFilters}
        responsaveis={responsaveis}
        locais={locais}
        disciplinas={disciplinas}
        data={filteredData}
      />
      
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <DashboardHeader lastUpdate={lastUpdate} onRefresh={handleRefresh} />
        
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Smart KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SmartKPICard
                title="Total Medido"
                value={formatNumber(stats.totalMeasured)}
                subtitle="unidades diversas"
                aiInsight={stats.valueVsAvg !== 0 ? 
                  `${stats.valueVsAvg > 0 ? '↑' : '↓'} ${Math.abs(stats.valueVsAvg).toFixed(1)}% ${stats.valueVsAvg > 0 ? 'acima' : 'abaixo'} da média histórica` : undefined}
                icon={Ruler}
                variant="default"
              />
              <SmartKPICard
                title="Valor Total"
                value={formatCurrency(stats.totalValue)}
                subtitle="acumulado no período"
                icon={DollarSign}
                variant="primary"
                trend={{ value: stats.valueVsAvg, isPositive: stats.valueVsAvg >= 0, label: 'vs média' }}
              />
              <SmartKPICard
                title="Itens Lançados"
                value={stats.itemCount}
                subtitle={stats.reincidentItems > 0 ? `${stats.reincidentItems} reincidentes` : 'registros de medição'}
                icon={FileText}
                variant="default"
              />
              <SmartKPICard
                title="Alertas"
                value={alerts.length}
                subtitle={stats.errorsCount > 0 ? `${stats.errorsCount} erros de cálculo` : 'outliers detectados'}
                icon={AlertTriangle}
                variant={alerts.length > 0 ? 'danger' : 'success'}
                aiInsight={alerts.length > 0 ? 'IA detectou inconsistências' : 'Dados dentro do padrão'}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <SmartEvolutionChart data={filteredData} />
              <SmartCompositionChart data={filteredData} />
            </div>

            {/* Alerts + Data Table */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <AlertsPanel alerts={alerts} />
              <div className="lg:col-span-3">
                <SmartDataTable data={filteredData} />
              </div>
            </div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};

export default Index;
