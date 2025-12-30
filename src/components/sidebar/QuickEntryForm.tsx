import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MeasurementEntry } from '@/types/measurement';
import { AutocompleteInput } from './AutocompleteInput';
import { MeasurementTabs, MeasurementTab } from './MeasurementTabs';
import { formatCurrency } from '@/lib/analytics';
import * as XLSX from 'xlsx';

interface QuickEntryFormProps {
  onAddEntry: (entry: MeasurementEntry) => void;
  disciplines: string[];
  locations: string[];
  importedData: MeasurementEntry[];
}

export const QuickEntryForm = ({ onAddEntry, disciplines, locations, importedData }: QuickEntryFormProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const [measurementTabs, setMeasurementTabs] = useState<MeasurementTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    descricao: '',
    disciplina: '',
    local: '',
    quantidade: '',
    unidade: 'm²',
    valorUnitario: ''
  });

  // Extrair sugestões únicas dos dados importados
  const suggestions = useMemo(() => {
    const descricoes = [...new Set(importedData.map(d => d.descricao).filter(Boolean))];
    const allDisciplines = [...new Set([...disciplines, ...importedData.map(d => d.disciplina).filter(Boolean)])];
    const allLocations = [...new Set([...locations, ...importedData.map(d => d.local).filter(Boolean)])];
    const unidades = [...new Set(importedData.map(d => d.unidade).filter(Boolean))];
    
    return { descricoes, disciplines: allDisciplines, locations: allLocations, unidades };
  }, [importedData, disciplines, locations]);

  // Quando seleciona uma descrição, preenche automaticamente os outros campos
  const handleDescricaoChange = (value: string) => {
    setFormData(prev => ({ ...prev, descricao: value }));
    
    // Buscar item correspondente nos dados importados
    const match = importedData.find(d => 
      d.descricao.toLowerCase() === value.toLowerCase()
    );
    
    if (match) {
      setFormData(prev => ({
        ...prev,
        descricao: value,
        disciplina: match.disciplina || prev.disciplina,
        local: match.local || prev.local,
        unidade: match.unidade || prev.unidade,
        valorUnitario: match.valorUnitario?.toString() || prev.valorUnitario
      }));
      
      toast({
        title: 'Item encontrado',
        description: `Dados preenchidos automaticamente de "${match.descricao.slice(0, 30)}..."`,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao || !formData.disciplina || !formData.quantidade || !formData.valorUnitario) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    const quantidade = parseFloat(formData.quantidade);
    const valorUnitario = parseFloat(formData.valorUnitario);

    const newEntry: MeasurementEntry = {
      id: `quick-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      responsavel: 'Lançamento Manual',
      local: formData.local || 'Não especificado',
      disciplina: formData.disciplina,
      descricao: formData.descricao,
      quantidade,
      unidade: formData.unidade,
      valorUnitario,
      valorTotal: quantidade * valorUnitario,
      status: 'pending'
    };

    // Adicionar à aba ativa se houver
    if (activeTabId) {
      setMeasurementTabs(prev => prev.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, entries: [...tab.entries, newEntry] }
          : tab
      ));
    }

    onAddEntry(newEntry);
    
    toast({
      title: 'Medição adicionada',
      description: `${formData.descricao.slice(0, 30)}... - ${formatCurrency(quantidade * valorUnitario)}`
    });

    setFormData({
      descricao: '',
      disciplina: '',
      local: '',
      quantidade: '',
      unidade: 'm²',
      valorUnitario: ''
    });
  };

  const handleExportTab = (tab: MeasurementTab) => {
    if (tab.entries.length === 0) {
      toast({
        title: 'Aba vazia',
        description: 'Adicione itens antes de exportar',
        variant: 'destructive'
      });
      return;
    }

    const exportData = tab.entries.map(e => ({
      'Descrição': e.descricao,
      'Disciplina': e.disciplina,
      'Local': e.local,
      'Quantidade': e.quantidade,
      'Unidade': e.unidade,
      'Valor Unitário': e.valorUnitario,
      'Valor Total': e.valorTotal,
      'Data': e.date
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tab.name);
    
    // Adicionar cabeçalho com info da empresa
    XLSX.utils.sheet_add_aoa(ws, [
      [`Empresa: ${tab.empresa}`],
      [`Período: ${tab.period}`],
      [`Data de Criação: ${tab.createdAt.toLocaleDateString('pt-BR')}`],
      []
    ], { origin: 'E1' });

    const fileName = `${tab.empresa.replace(/\s+/g, '_')}_${tab.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: 'Exportado com sucesso',
      description: `Arquivo ${fileName} gerado`
    });
  };

  const handleTabsChange = (tabs: MeasurementTab[]) => {
    setMeasurementTabs(tabs);
    if (tabs.length > 0 && !activeTabId) {
      setActiveTabId(tabs[tabs.length - 1].id);
    }
  };

  return (
    <div className="space-y-3">
      <MeasurementTabs 
        tabs={measurementTabs} 
        onTabsChange={handleTabsChange}
        onExport={handleExportTab}
      />
      
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle 
            className="text-sm font-medium flex items-center gap-2 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Zap className="h-4 w-4 text-primary" />
            Lançamento Rápido
            <span className="text-xs text-muted-foreground ml-auto">
              {isExpanded ? '▲' : '▼'}
            </span>
          </CardTitle>
        </CardHeader>
        
        {isExpanded && (
          <CardContent>
            {importedData.length === 0 && (
              <div className="text-xs text-muted-foreground mb-3 p-2 bg-secondary/30 rounded">
                💡 Importe uma planilha para habilitar o autocomplete inteligente
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Descrição * (digite para buscar)</Label>
                <AutocompleteInput
                  value={formData.descricao}
                  onChange={handleDescricaoChange}
                  suggestions={suggestions.descricoes}
                  placeholder="Digite: escavação, assentamento..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Disciplina *</Label>
                <Select 
                  value={formData.disciplina} 
                  onValueChange={(value) => setFormData({ ...formData, disciplina: value })}
                >
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {suggestions.disciplines.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Local</Label>
                <Select 
                  value={formData.local} 
                  onValueChange={(value) => setFormData({ ...formData, local: value })}
                >
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {suggestions.locations.map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Quantidade *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Unidade</Label>
                  <Select 
                    value={formData.unidade} 
                    onValueChange={(value) => setFormData({ ...formData, unidade: value })}
                  >
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m²">m²</SelectItem>
                      <SelectItem value="m³">m³</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                      <SelectItem value="un">un</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="t">t</SelectItem>
                      {suggestions.unidades.filter(u => !['m²', 'm³', 'm', 'un', 'kg', 't'].includes(u)).map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Valor Unitário (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.valorUnitario}
                  onChange={(e) => setFormData({ ...formData, valorUnitario: e.target.value })}
                  className="bg-secondary/50"
                />
              </div>

              {activeTabId && (
                <div className="text-xs text-muted-foreground p-2 bg-primary/10 rounded">
                  📌 Será adicionado à aba: {measurementTabs.find(t => t.id === activeTabId)?.name}
                </div>
              )}

              <Button type="submit" className="w-full" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Medição
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
