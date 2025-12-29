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
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
        {title}
      </Label>
      <ScrollArea className="h-24">
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
                className="text-sm font-normal cursor-pointer truncate"
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
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {activeFilterCount}
              </span>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs"
              onClick={handleReset}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
