import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, RotateCcw } from 'lucide-react';
import { FilterState } from '@/types/measurement';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  responsaveis: string[];
  locais: string[];
  disciplinas: string[];
}

export const FilterPanel = ({ 
  filters, 
  onFiltersChange, 
  responsaveis, 
  locais, 
  disciplinas 
}: FilterPanelProps) => {
  const handleFilterChange = (
    category: 'responsavel' | 'local' | 'disciplina',
    value: string,
    checked: boolean
  ) => {
    const newFilters = { ...filters };
    if (checked) {
      newFilters[category] = [...newFilters[category], value];
    } else {
      newFilters[category] = newFilters[category].filter(v => v !== value);
    }
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    onFiltersChange({
      responsavel: [],
      local: [],
      disciplina: [],
      dateRange: null
    });
  };

  const activeFilterCount = 
    filters.responsavel.length + 
    filters.local.length + 
    filters.disciplina.length;

  const FilterSection = ({ 
    title, 
    items, 
    category,
    selected
  }: { 
    title: string; 
    items: string[]; 
    category: 'responsavel' | 'local' | 'disciplina';
    selected: string[];
  }) => (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {title}
      </Label>
      <ScrollArea className="h-16">
        <div className="space-y-2">
          {items.map(item => (
            <div key={item} className="flex items-center space-x-2">
              <Checkbox
                id={`${category}-${item}`}
                checked={selected.includes(item)}
                onCheckedChange={(checked) => 
                  handleFilterChange(category, item, checked as boolean)
                }
              />
              <Label 
                htmlFor={`${category}-${item}`}
                className="text-[10px] font-normal cursor-pointer truncate"
              >
                {item}
              </Label>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <Card className="border-border max-w-[180px]">
      <CardHeader className="pb-1 px-2 py-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium flex items-center gap-1">
            <Filter className="h-3 w-3 text-primary" />
            <span className="truncate">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="px-1 py-0.5 text-[10px] bg-primary text-primary-foreground rounded-full">
                {activeFilterCount}
              </span>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 px-1 text-[10px]"
              onClick={handleReset}
            >
              <RotateCcw className="h-2.5 w-2.5 mr-0.5" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-2 pb-2">
        <FilterSection 
          title="Responsável" 
          items={responsaveis} 
          category="responsavel"
          selected={filters.responsavel}
        />
        <FilterSection 
          title="Local" 
          items={locais} 
          category="local"
          selected={filters.local}
        />
        <FilterSection 
          title="Disciplina" 
          items={disciplinas} 
          category="disciplina"
          selected={filters.disciplina}
        />
      </CardContent>
    </Card>
  );
};
