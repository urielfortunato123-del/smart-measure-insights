import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MeasurementEntry } from '@/types/measurement';

interface QuickEntryFormProps {
  onAddEntry: (entry: MeasurementEntry) => void;
  disciplines: string[];
  locations: string[];
}

export const QuickEntryForm = ({ onAddEntry, disciplines, locations }: QuickEntryFormProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    descricao: '',
    disciplina: '',
    local: '',
    quantidade: '',
    unidade: 'm²',
    valorUnitario: ''
  });

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

    onAddEntry(newEntry);
    
    toast({
      title: 'Medição adicionada',
      description: `${formData.descricao} - R$ ${(quantidade * valorUnitario).toLocaleString('pt-BR')}`
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

  return (
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
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição *</Label>
              <Input
                placeholder="Escavação de material..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="bg-secondary/50"
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
                  {disciplines.map(d => (
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
                  {locations.map(l => (
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

            <Button type="submit" className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Medição
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
};
