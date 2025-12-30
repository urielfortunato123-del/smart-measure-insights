import { useState, useMemo, useCallback } from 'react';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { EvolutionChart } from '@/components/dashboard/EvolutionChart';
import { CompositionChart } from '@/components/dashboard/CompositionChart';
import { DataTable } from '@/components/dashboard/DataTable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { sampleMeasurements, getUniqueValues, calculateStats } from '@/data/sampleData';
import { MeasurementEntry, FilterState } from '@/types/measurement';
import { Ruler, DollarSign, FileText, AlertTriangle } from 'lucide-react';

const Index = () => {
  const [data, setData] = useState<MeasurementEntry[]>(sampleMeasurements);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [filters, setFilters] = useState<FilterState>({
    responsavel: [],
    local: [],
    disciplina: [],
    dateRange: null
  });

  // Get unique values for filters
  const responsaveis = useMemo(() => getUniqueValues(data, 'responsavel'), [data]);
  const locais = useMemo(() => getUniqueValues(data, 'local'), [data]);
  const disciplinas = useMemo(() => getUniqueValues(data, 'disciplina'), [data]);

  // Apply filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filters.responsavel.length > 0 && !filters.responsavel.includes(item.responsavel)) {
        return false;
      }
      if (filters.local.length > 0 && !filters.local.includes(item.local)) {
        return false;
      }
      if (filters.disciplina.length > 0 && !filters.disciplina.includes(item.disciplina)) {
        return false;
      }
      return true;
    });
  }, [data, filters]);

  // Calculate stats
  const stats = useMemo(() => calculateStats(filteredData), [filteredData]);

  const handleDataLoaded = useCallback((newData: MeasurementEntry[]) => {
    if (newData.length > 0) {
      setData(newData);
    }
    setLastUpdate(new Date());
  }, []);

  const handleAddEntry = useCallback((entry: MeasurementEntry) => {
    setData(prev => [...prev, entry]);
    setLastUpdate(new Date());
  }, []);

  const handleRefresh = useCallback(() => {
    setLastUpdate(new Date());
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value);
  };

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
      />
      
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <DashboardHeader 
          lastUpdate={lastUpdate}
          onRefresh={handleRefresh}
        />
        
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Total Medido"
                value={formatNumber(stats.totalMeasured)}
                subtitle="unidades diversas"
                icon={Ruler}
                variant="default"
              />
              <KPICard
                title="Valor Total"
                value={formatCurrency(stats.totalValue)}
                subtitle="acumulado no período"
                icon={DollarSign}
                variant="primary"
                trend={{ value: 12.5, isPositive: true }}
              />
              <KPICard
                title="Itens Lançados"
                value={stats.itemCount}
                subtitle="registros de medição"
                icon={FileText}
                variant="default"
              />
              <KPICard
                title="Alertas"
                value={stats.outlierCount}
                subtitle="outliers detectados"
                icon={AlertTriangle}
                variant={stats.outlierCount > 0 ? 'warning' : 'success'}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <EvolutionChart data={filteredData} />
              <CompositionChart data={filteredData} />
            </div>

            {/* Data Table */}
            <DataTable data={filteredData} />
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};

export default Index;
