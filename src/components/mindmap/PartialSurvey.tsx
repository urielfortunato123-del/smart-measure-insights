import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload, 
  FileText, 
  Plus, 
  Trash2, 
  Loader2,
  ClipboardList,
  MapPin,
  Layers,
  Calculator,
  X,
  Sparkles,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SurveyItem {
  id: string;
  item_code: string | null;
  description: string;
  unit: string;
  total_quantity: number;
  partial_quantity: number;
  unit_price: number;
  total_value: number;
  location: string | null;
  floor_level: string | null;
  sector: string | null;
  notes: string | null;
  is_selected: boolean;
}

interface PartialSurveyProps {
  mindMapId: string;
  mindMapTopic: string;
}

export const PartialSurvey = ({ mindMapId, mindMapTopic }: PartialSurveyProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [items, setItems] = useState<SurveyItem[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [surveyName, setSurveyName] = useState('');

  const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase().split('.').pop();
    if (!['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      toast({
        title: 'Formato não suportado',
        description: 'Use arquivos PDF, Word ou TXT.',
        variant: 'destructive'
      });
      return;
    }

    setUploadedFile(file);
    toast({
      title: 'Arquivo carregado',
      description: `${file.name} pronto para análise.`
    });
  };

  const extractFromFile = async () => {
    if (!uploadedFile) return;

    setIsExtracting(true);
    try {
      // Read file content
      const fileContent = await readFileContent(uploadedFile);
      
      if (!fileContent || fileContent.length < 50) {
        toast({
          title: 'Conteúdo insuficiente',
          description: 'O arquivo parece estar vazio ou com pouco texto.',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-survey`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            fileContent: fileContent.substring(0, 50000), // Limit content size
            fileName: uploadedFile.name,
            projectContext: mindMapTopic
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao extrair dados');
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const newItems: SurveyItem[] = data.items.map((item: any) => ({
          id: generateId(),
          item_code: item.item_code || null,
          description: item.description || 'Item sem descrição',
          unit: item.unit || 'UN',
          total_quantity: Number(item.total_quantity) || 0,
          partial_quantity: 0,
          unit_price: 0,
          total_value: 0,
          location: item.location || null,
          floor_level: item.floor_level || null,
          sector: item.sector || null,
          notes: null,
          is_selected: false
        }));

        setItems(prev => [...prev, ...newItems]);
        toast({
          title: 'Itens extraídos!',
          description: `${newItems.length} itens encontrados no arquivo.`
        });
      } else {
        toast({
          title: 'Nenhum item encontrado',
          description: 'Não foi possível identificar itens de levantamento.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error extracting:', error);
      toast({
        title: 'Erro na extração',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  };

  const addManualItem = () => {
    const newItem: SurveyItem = {
      id: generateId(),
      item_code: null,
      description: '',
      unit: 'UN',
      total_quantity: 0,
      partial_quantity: 0,
      unit_price: 0,
      total_value: 0,
      location: null,
      floor_level: null,
      sector: null,
      notes: null,
      is_selected: false
    };
    setItems(prev => [...prev, newItem]);
  };

  const updateItem = (id: string, updates: Partial<SurveyItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        // Recalculate total value
        updated.total_value = updated.partial_quantity * updated.unit_price;
        return updated;
      }
      return item;
    }));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const toggleItemSelection = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, is_selected: !item.is_selected } : item
    ));
  };

  const selectAllItems = () => {
    const allSelected = items.every(item => item.is_selected);
    setItems(prev => prev.map(item => ({ ...item, is_selected: !allSelected })));
  };

  const getSelectedTotal = () => {
    return items
      .filter(item => item.is_selected)
      .reduce((sum, item) => sum + item.total_value, 0);
  };

  const getSelectedCount = () => {
    return items.filter(item => item.is_selected).length;
  };

  const saveSurvey = async () => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para salvar.',
        variant: 'destructive'
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Adicione itens',
        description: 'O levantamento precisa ter pelo menos um item.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create survey
      const { data: survey, error: surveyError } = await supabase
        .from('project_surveys')
        .insert({
          user_id: user.id,
          mind_map_id: mindMapId,
          name: surveyName || `Levantamento - ${mindMapTopic}`,
          description: `Levantamento parcial para ${mindMapTopic}`,
          source_file_name: uploadedFile?.name || null,
          source_file_type: uploadedFile?.type || null,
          total_items: items.length
        })
        .select()
        .single();

      if (surveyError) throw surveyError;

      // Insert items
      const surveyItems = items.map(item => ({
        user_id: user.id,
        survey_id: survey.id,
        item_code: item.item_code,
        description: item.description,
        unit: item.unit,
        total_quantity: item.total_quantity,
        partial_quantity: item.partial_quantity,
        unit_price: item.unit_price,
        total_value: item.total_value,
        location: item.location,
        floor_level: item.floor_level,
        sector: item.sector,
        notes: item.notes,
        is_selected: item.is_selected
      }));

      const { error: itemsError } = await supabase
        .from('survey_items')
        .insert(surveyItems);

      if (itemsError) throw itemsError;

      toast({
        title: 'Levantamento salvo!',
        description: `${items.length} itens salvos com sucesso.`
      });

    } catch (error) {
      console.error('Error saving survey:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <Card 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 rounded-lg p-2">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-card-foreground">Levantamento Parcial</h3>
              <p className="text-sm text-muted-foreground">
                Faça o levantamento parcial dos itens do projeto
              </p>
            </div>
            <Badge variant="outline">Novo</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Levantamento Parcial
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Survey Name */}
        <Input
          placeholder="Nome do levantamento (opcional)"
          value={surveyName}
          onChange={(e) => setSurveyName(e.target.value)}
        />

        {/* File Upload Section */}
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="file"
              id="survey-file-upload"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="survey-file-upload"
              className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {uploadedFile ? uploadedFile.name : 'Upload PDF, Word ou TXT'}
              </span>
            </label>
          </div>
          {uploadedFile && (
            <Button 
              onClick={extractFromFile} 
              disabled={isExtracting}
              className="gap-2"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extraindo...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Extrair com IA
                </>
              )}
            </Button>
          )}
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={addManualItem} className="gap-1">
            <Plus className="h-4 w-4" />
            Adicionar Item
          </Button>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <>
                <Button variant="ghost" size="sm" onClick={selectAllItems}>
                  {items.every(item => item.is_selected) ? 'Desmarcar' : 'Selecionar'} Todos
                </Button>
                <Badge variant="secondary">
                  {getSelectedCount()}/{items.length} selecionados
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Items List */}
        {items.length > 0 && (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {items.map((item, index) => (
                <Card key={item.id} className={`p-3 ${item.is_selected ? 'ring-2 ring-primary' : ''}`}>
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.is_selected}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Código"
                            value={item.item_code || ''}
                            onChange={(e) => updateItem(item.id, { item_code: e.target.value })}
                            className="w-24"
                          />
                          <Input
                            placeholder="Descrição do item *"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                        
                        {/* Quantities Row */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          <Input
                            placeholder="Unidade"
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                          />
                          <Input
                            type="number"
                            placeholder="Qtd Total"
                            value={item.total_quantity || ''}
                            onChange={(e) => updateItem(item.id, { total_quantity: Number(e.target.value) })}
                          />
                          <Input
                            type="number"
                            placeholder="Qtd Parcial"
                            value={item.partial_quantity || ''}
                            onChange={(e) => updateItem(item.id, { partial_quantity: Number(e.target.value) })}
                          />
                          <Input
                            type="number"
                            placeholder="Preço Unit."
                            value={item.unit_price || ''}
                            onChange={(e) => updateItem(item.id, { unit_price: Number(e.target.value) })}
                          />
                          <div className="flex items-center gap-2 px-3 bg-muted rounded-md">
                            <Calculator className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              R$ {item.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Location Row */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                            <Input
                              placeholder="Localização"
                              value={item.location || ''}
                              onChange={(e) => updateItem(item.id, { location: e.target.value })}
                              className="text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Layers className="h-3 w-3 text-muted-foreground shrink-0" />
                            <Input
                              placeholder="Pavimento"
                              value={item.floor_level || ''}
                              onChange={(e) => updateItem(item.id, { floor_level: e.target.value })}
                              className="text-xs"
                            />
                          </div>
                          <Input
                            placeholder="Setor/Ambiente"
                            value={item.sector || ''}
                            onChange={(e) => updateItem(item.id, { sector: e.target.value })}
                            className="text-xs"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem(item.id)}
                        className="shrink-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum item adicionado</p>
            <p className="text-sm">Faça upload de um arquivo ou adicione itens manualmente</p>
          </div>
        )}

        {/* Summary & Save */}
        {items.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">
                Total dos itens selecionados:
              </p>
              <p className="text-xl font-bold text-primary">
                R$ {getSelectedTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Button onClick={saveSurvey} disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Salvar Levantamento
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
