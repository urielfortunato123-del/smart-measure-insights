import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { SmartKPICard } from '@/components/dashboard/SmartKPICard';
import { SmartEvolutionChart } from '@/components/dashboard/SmartEvolutionChart';
import { SmartCompositionChart } from '@/components/dashboard/SmartCompositionChart';
import { SmartDataTable } from '@/components/dashboard/SmartDataTable';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { AlertDetailModal } from '@/components/dashboard/AlertDetailModal';
import { UpdatesNotification } from '@/components/updates/UpdatesNotification';
import { DemoTimer } from '@/components/demo/DemoTimer';
import { DemoExpiredModal } from '@/components/demo/DemoExpiredModal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { getUniqueValues, demoMeasurements } from '@/data/sampleData';
import { MeasurementEntry, FilterState } from '@/types/measurement';
import { calculateSmartStats, generateAlerts, formatCurrency, formatNumber, Alert } from '@/lib/analytics';
import { useLayout } from '@/contexts/LayoutContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Ruler, DollarSign, FileText, AlertTriangle, Play, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode } from '@/hooks/useDemoMode';

const Index = () => {
  const { user, loading } = useAuth();
  const { layout } = useLayout();
  const { setMeasurementData: setGlobalMeasurementData } = useAppData();
  const navigate = useNavigate();
  const [data, setData] = useState<MeasurementEntry[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [filters, setFilters] = useState<FilterState>({
    responsavel: [],
    local: [],
    disciplina: [],
    dateRange: null
  });
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const { toast } = useToast();
  const { isDemoMode, demoExpired, timeRemaining, formattedTime, usesRemaining, maxWeeklyUses } = useDemoMode();

  // Sync local data to global context
  useEffect(() => {
    setGlobalMeasurementData(data);
  }, [data, setGlobalMeasurementData]);

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
    setData(newData);
    setLastUpdate(new Date());
  }, []);

  const handleAddEntry = useCallback((entry: MeasurementEntry) => {
    setData(prev => [...prev, entry]);
    setLastUpdate(new Date());
  }, []);

  const handleRefresh = useCallback(() => setLastUpdate(new Date()), []);

  const handleLoadDemo = useCallback(() => {
    setData(demoMeasurements);
    setLastUpdate(new Date());
    toast({
      title: 'Dados de demonstração carregados!',
      description: `${demoMeasurements.length} itens carregados para visualização.`
    });
  }, [toast]);

  // Check for exported survey data from mind map
  useEffect(() => {
    const exportedData = localStorage.getItem('survey_export');
    if (exportedData) {
      try {
        const parsed = JSON.parse(exportedData);
        if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
          const newEntries: MeasurementEntry[] = parsed.items.map((item: any, index: number) => ({
            id: `survey-${Date.now()}-${index}`,
            codigo: item.codigo || `ITEM-${String(index + 1).padStart(3, '0')}`,
            descricao: item.descricao || 'Item sem descrição',
            unidade: item.unidade || 'UN',
            quantidade: Number(item.quantidade) || 0,
            valorUnitario: Number(item.valorUnitario) || 0,
            valorTotal: Number(item.valorTotal) || (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0),
            local: item.local || 'Não informado',
            disciplina: item.disciplina || 'Geral',
            responsavel: item.responsavel || 'Não informado',
            data: new Date().toISOString().split('T')[0],
            status: 'normal' as const
          }));
          
          setData(prev => [...prev, ...newEntries]);
          setLastUpdate(new Date());
          
          toast({
            title: `Levantamento importado!`,
            description: `${newEntries.length} itens de "${parsed.surveyName || 'Levantamento'}" adicionados.`
          });
        }
      } catch (e) {
        console.error('Error parsing survey export:', e);
        toast({
          title: 'Erro ao importar',
          description: 'Não foi possível importar os dados do levantamento.',
          variant: 'destructive'
        });
      } finally {
        // Always clear the export data to avoid re-processing
        localStorage.removeItem('survey_export');
      }
    }
  }, [toast]);

  const handleAlertClick = useCallback((alert: Alert) => {
    setSelectedAlert(alert);
    setAlertModalOpen(true);
  }, []);

  const handleAlertsKPIClick = useCallback(() => {
    if (alerts.length > 0) {
      setSelectedAlert(alerts[0]);
      setAlertModalOpen(true);
    }
  }, [alerts]);

  // Find related item for the selected alert
  const relatedItem = useMemo(() => {
    if (!selectedAlert) return undefined;
    return filteredData.find(item => 
      item.descricao === selectedAlert.itemDescription ||
      item.id === selectedAlert.itemId
    );
  }, [selectedAlert, filteredData]);

  // Redirect to auth if not logged in AND not in demo mode
  useEffect(() => {
    if (!loading && !user && !isDemoMode && !demoExpired) {
      navigate('/auth');
    }
  }, [user, loading, navigate, isDemoMode, demoExpired]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated and not in demo mode
  if (!user && !isDemoMode) {
    return null;
  }

  const isHorizontal = layout.sidebarPosition === 'left' || layout.sidebarPosition === 'right';
  const isHidden = layout.sidebarPosition === 'hidden';

  const sidebarPanel = !isHidden && (
    <ResizablePanel 
      defaultSize={15} 
      minSize={10} 
      maxSize={30}
    >
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
    </ResizablePanel>
  );

  return (
    <div className="flex min-h-screen w-full liquid-background">
      {/* Demo Mode Timer */}
      {isDemoMode && !demoExpired && (
        <DemoTimer formattedTime={formattedTime} timeRemaining={timeRemaining} usesRemaining={usesRemaining} maxWeeklyUses={maxWeeklyUses} />
      )}
      
      {/* Demo Expired Modal */}
      <DemoExpiredModal open={demoExpired && !user} />
      <ResizablePanelGroup 
        direction={isHorizontal ? 'horizontal' : 'vertical'} 
        className="min-h-screen"
      >
        {(layout.sidebarPosition === 'left' || layout.sidebarPosition === 'top') && sidebarPanel}
        {!isHidden && (layout.sidebarPosition === 'left' || layout.sidebarPosition === 'top') && (
          <ResizableHandle withHandle className="bg-white/10 hover:bg-white/20 transition-colors" />
        )}
        
        <ResizablePanel defaultSize={isHidden ? 100 : 85} minSize={50}>
      
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden bg-white/5 backdrop-blur-sm">
        <DashboardHeader lastUpdate={lastUpdate} onRefresh={handleRefresh} />
        
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Empty State - Show demo button */}
            {data.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4 bg-card/30 rounded-xl border border-dashed border-border">
                <Sparkles className="h-12 w-12 text-primary/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Bem-vindo ao Dashboard Inteligente</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Importe uma planilha de medição para começar a análise com IA, 
                  ou carregue dados de demonstração para explorar o sistema.
                </p>
                <Button onClick={handleLoadDemo} size="lg" className="gap-2">
                  <Play className="h-5 w-5" />
                  Carregar Demonstração
                </Button>
              </div>
            )}

            {/* Smart KPI Cards */}
            {data.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <SmartKPICard
                    title="Total Medido"
                    value={formatNumber(stats.totalMeasured)}
                    subtitle="unidades diversas"
                    aiInsight={stats.valueVsAvg !== 0 ? 
                      `${stats.valueVsAvg > 0 ? '↑' : '↓'} ${Math.abs(stats.valueVsAvg).toFixed(1)}% ${stats.valueVsAvg > 0 ? 'acima' : 'abaixo'} da média histórica` : undefined}
                    icon={Ruler}
                    variant="default"
                    clickable={false}
                  />
                  <SmartKPICard
                    title="Valor Total"
                    value={formatCurrency(stats.totalValue)}
                    subtitle="acumulado no período"
                    icon={DollarSign}
                    variant="primary"
                    trend={{ value: stats.valueVsAvg, isPositive: stats.valueVsAvg >= 0, label: 'vs média' }}
                    clickable={false}
                  />
                  <SmartKPICard
                    title="Itens Lançados"
                    value={stats.itemCount}
                    subtitle={stats.reincidentItems > 0 ? `${stats.reincidentItems} reincidentes` : 'registros de medição'}
                    icon={FileText}
                    variant="default"
                    clickable={false}
                  />
                  <SmartKPICard
                    title="Alertas"
                    value={alerts.length}
                    subtitle={stats.errorsCount > 0 ? `${stats.errorsCount} erros de cálculo` : 'outliers detectados'}
                    icon={AlertTriangle}
                    variant={alerts.length > 0 ? 'danger' : 'success'}
                    aiInsight={alerts.length > 0 ? 'IA detectou inconsistências' : 'Dados dentro do padrão'}
                    onClick={handleAlertsKPIClick}
                    clickable={alerts.length > 0}
                  />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <SmartEvolutionChart data={filteredData} />
                  <SmartCompositionChart data={filteredData} />
                </div>

                {/* Alerts + Data Table */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <AlertsPanel alerts={alerts} onAlertClick={handleAlertClick} />
                  <div className="lg:col-span-3">
                    <SmartDataTable data={filteredData} />
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </main>
        </ResizablePanel>
        
        {!isHidden && (layout.sidebarPosition === 'right' || layout.sidebarPosition === 'bottom') && (
          <ResizableHandle withHandle className="bg-border hover:bg-primary/20 transition-colors" />
        )}
        {(layout.sidebarPosition === 'right' || layout.sidebarPosition === 'bottom') && sidebarPanel}
      </ResizablePanelGroup>

      {/* Alert Detail Modal */}
      <AlertDetailModal
        alert={selectedAlert}
        open={alertModalOpen}
        onOpenChange={setAlertModalOpen}
        relatedItem={relatedItem}
        allData={filteredData}
      />

      {/* Updates Notification */}
      <UpdatesNotification />
    </div>
  );
};

export default Index;
