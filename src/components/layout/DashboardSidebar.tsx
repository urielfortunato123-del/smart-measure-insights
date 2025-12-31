import { useState } from 'react';
import { FileUpload } from '@/components/sidebar/FileUpload';
import { TPUUpload } from '@/components/sidebar/TPUUpload';
import { QuickEntryForm } from '@/components/sidebar/QuickEntryForm';
import { FilterPanel } from '@/components/sidebar/FilterPanel';
import { AIAssistant } from '@/components/sidebar/AIAssistant';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MeasurementEntry, FilterState } from '@/types/measurement';
import { TPUEntry } from '@/types/tpu';

interface DashboardSidebarProps {
  onDataLoaded: (data: MeasurementEntry[]) => void;
  onAddEntry: (entry: MeasurementEntry) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  responsaveis: string[];
  locais: string[];
  disciplinas: string[];
  data: MeasurementEntry[];
}

export const DashboardSidebar = ({
  onDataLoaded,
  onAddEntry,
  filters,
  onFiltersChange,
  responsaveis,
  locais,
  disciplinas,
  data
}: DashboardSidebarProps) => {
  const [tpuData, setTPUData] = useState<TPUEntry[]>([]);

  const handleTPULoaded = (entries: TPUEntry[]) => {
    setTPUData(entries);
    console.log('TPU loaded:', entries.length, 'items');
  };

  return (
    <aside className="w-80 min-w-[320px] border-r border-border bg-sidebar shrink-0 flex flex-col h-screen overflow-hidden">
      <div className="p-4 border-b border-border bg-sidebar sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">EI</span>
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Engenharia Inteligente</h1>
            <p className="text-xs text-muted-foreground">Dashboard de Medições</p>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 overflow-x-hidden">
        <div className="p-4 space-y-4 overflow-hidden">
          <FileUpload onDataLoaded={onDataLoaded} />
          
          <Separator />
          
          <TPUUpload onTPULoaded={handleTPULoaded} />
          
          <Separator />
          
          <QuickEntryForm 
            onAddEntry={onAddEntry}
            disciplines={disciplinas}
            locations={locais}
            importedData={data}
          />
          
          <Separator />
          
          <FilterPanel
            filters={filters}
            onFiltersChange={onFiltersChange}
            responsaveis={responsaveis}
            locais={locais}
            disciplinas={disciplinas}
          />
          
          <Separator />
          
          <AIAssistant data={data} />
        </div>
      </ScrollArea>
    </aside>
  );
};
