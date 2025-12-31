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
import logo from '@/assets/logo.png';

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
    <aside className="w-full h-full border-r border-white/15 bg-white/10 backdrop-blur-xl flex flex-col overflow-hidden">
      <div className="p-3 border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <img 
            src={logo} 
            alt="Engenharia Inteligente" 
            className="w-10 h-10 object-contain drop-shadow-lg"
          />
          <div>
            <h1 className="text-sm font-semibold text-foreground drop-shadow-sm">Eng. Inteligente</h1>
            <p className="text-xs text-muted-foreground">Medições</p>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 overflow-x-hidden">
        <div className="p-3 space-y-3 overflow-hidden">
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
