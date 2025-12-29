import { FileUpload } from '@/components/sidebar/FileUpload';
import { QuickEntryForm } from '@/components/sidebar/QuickEntryForm';
import { FilterPanel } from '@/components/sidebar/FilterPanel';
import { AIAssistant } from '@/components/sidebar/AIAssistant';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MeasurementEntry, FilterState } from '@/types/measurement';

interface DashboardSidebarProps {
  onDataLoaded: (data: any[]) => void;
  onAddEntry: (entry: MeasurementEntry) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  responsaveis: string[];
  locais: string[];
  disciplinas: string[];
}

export const DashboardSidebar = ({
  onDataLoaded,
  onAddEntry,
  filters,
  onFiltersChange,
  responsaveis,
  locais,
  disciplinas
}: DashboardSidebarProps) => {
  return (
    <aside className="w-80 border-r border-border bg-sidebar shrink-0 flex flex-col h-screen">
      <div className="p-4 border-b border-border">
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
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <FileUpload onDataLoaded={onDataLoaded} />
          
          <Separator />
          
          <QuickEntryForm 
            onAddEntry={onAddEntry}
            disciplines={disciplinas}
            locations={locais}
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
          
          <AIAssistant dataContext="" />
        </div>
      </ScrollArea>
    </aside>
  );
};
