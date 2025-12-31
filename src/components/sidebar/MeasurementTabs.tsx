import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Download, Calendar, Building2 } from 'lucide-react';
import { MeasurementEntry } from '@/types/measurement';
import { formatCurrency } from '@/lib/analytics';

export interface MeasurementTab {
  id: string;
  name: string;
  period: 'semanal' | 'mensal' | 'quinzenal' | 'diario';
  empresa: string;
  entries: MeasurementEntry[];
  createdAt: Date;
}

interface MeasurementTabsProps {
  tabs: MeasurementTab[];
  onTabsChange: (tabs: MeasurementTab[]) => void;
  onExport: (tab: MeasurementTab) => void;
}

export const MeasurementTabs = ({ tabs, onTabsChange, onExport }: MeasurementTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id || '');
  const [isCreating, setIsCreating] = useState(false);
  const [newTab, setNewTab] = useState({
    name: '',
    period: 'mensal' as const,
    empresa: ''
  });

  const handleCreateTab = () => {
    if (!newTab.name || !newTab.empresa) return;
    
    const tab: MeasurementTab = {
      id: `tab-${Date.now()}`,
      name: newTab.name,
      period: newTab.period,
      empresa: newTab.empresa,
      entries: [],
      createdAt: new Date()
    };
    
    onTabsChange([...tabs, tab]);
    setActiveTab(tab.id);
    setNewTab({ name: '', period: 'mensal', empresa: '' });
    setIsCreating(false);
  };

  const handleDeleteTab = (tabId: string) => {
    const updated = tabs.filter(t => t.id !== tabId);
    onTabsChange(updated);
    if (activeTab === tabId && updated.length > 0) {
      setActiveTab(updated[0].id);
    }
  };

  const getTotal = (entries: MeasurementEntry[]) => 
    entries.reduce((sum, e) => sum + e.valorTotal, 0);

  if (tabs.length === 0 && !isCreating) {
    return (
      <Card className="border-border max-w-[180px]">
        <CardHeader className="pb-1 px-2 py-2">
          <CardTitle className="text-xs font-medium flex items-center gap-1">
            <Calendar className="h-3 w-3 text-primary" />
            <span className="truncate">Abas de Medição</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          <Button 
            variant="outline" 
            className="w-full h-6 text-[10px]" 
            size="sm"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Criar Nova Medição
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border max-w-[180px]">
      <CardHeader className="pb-1 px-2 py-2">
        <CardTitle className="text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-primary" />
            <span className="truncate">Abas de Medição</span>
          </span>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setIsCreating(true)}>
            <Plus className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-2 pb-2">
        {isCreating && (
          <div className="p-3 bg-secondary/30 rounded-lg space-y-2 border border-border">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome da Medição</Label>
              <Input
                placeholder="Ex: Medição 01 - Janeiro"
                value={newTab.name}
                onChange={(e) => setNewTab({ ...newTab, name: e.target.value })}
                className="bg-secondary/50 h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Empresa</Label>
              <div className="relative">
                <Building2 className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Nome da empresa"
                  value={newTab.empresa}
                  onChange={(e) => setNewTab({ ...newTab, empresa: e.target.value })}
                  className="bg-secondary/50 h-8 text-sm pl-7"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Período</Label>
              <Select 
                value={newTab.period} 
                onValueChange={(v: any) => setNewTab({ ...newTab, period: v })}
              >
                <SelectTrigger className="bg-secondary/50 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diário</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="quinzenal">Quinzenal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleCreateTab}>
                Criar
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs"
                onClick={() => setIsCreating(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {tabs.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <ScrollArea className="w-full">
              <TabsList className="w-full justify-start h-auto p-1 bg-secondary/30">
                {tabs.map(tab => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="text-xs px-2 py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {tab.name.length > 10 ? tab.name.slice(0, 10) + '...' : tab.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>

            {tabs.map(tab => (
              <TabsContent key={tab.id} value={tab.id} className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-medium">{tab.empresa}</div>
                    <Badge variant="outline" className="text-[10px]">
                      {tab.period}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground">{tab.entries.length} itens</div>
                    <div className="font-medium text-primary">
                      {formatCurrency(getTotal(tab.entries))}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 h-7 text-xs"
                    onClick={() => onExport(tab)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Exportar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDeleteTab(tab.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
