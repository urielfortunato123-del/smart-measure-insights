import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
  Download,
  FileOutput,
  Send,
  Printer,
  Building2
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

interface TechnicalInfo {
  company_name: string;
  engineer_name: string;
  crea_number: string;
  project_name: string;
  client_name: string;
  date: string;
}

interface PartialSurveyProps {
  mindMapId: string;
  mindMapTopic: string;
}

export const PartialSurvey = ({ mindMapId, mindMapTopic }: PartialSurveyProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [items, setItems] = useState<SurveyItem[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [surveyName, setSurveyName] = useState('');
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [technicalInfo, setTechnicalInfo] = useState<TechnicalInfo>({
    company_name: '',
    engineer_name: '',
    crea_number: '',
    project_name: mindMapTopic,
    client_name: '',
    date: new Date().toLocaleDateString('pt-BR')
  });

  const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase().split('.').pop();
    if (!['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls'].includes(ext || '')) {
      toast({
        title: 'Formato não suportado',
        description: 'Use arquivos PDF, Word, Excel ou TXT.',
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
      // Convert file to base64 for PDF processing on backend
      const fileBase64 = await readFileAsBase64(uploadedFile);
      const ext = uploadedFile.name.toLowerCase().split('.').pop();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-survey`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            fileBase64,
            fileType: ext,
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
          unit_price: Number(item.unit_price) || 0,
          total_value: 0,
          location: item.location || null,
          floor_level: item.floor_level || null,
          sector: item.sector || null,
          notes: null,
          is_selected: false
        }));

        setItems(prev => [...prev, ...newItems]);
        toast({
          title: 'Itens extraídos com sucesso!',
          description: `${newItems.length} itens encontrados no projeto.`
        });
      } else {
        toast({
          title: 'Nenhum item encontrado',
          description: 'Não foi possível identificar itens de quantitativo. Adicione manualmente.',
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

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
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

  const exportToMainScreen = () => {
    const selectedItems = items.filter(item => item.is_selected);
    if (selectedItems.length === 0) {
      toast({
        title: 'Selecione itens',
        description: 'Marque os itens que deseja exportar para a tela principal.',
        variant: 'destructive'
      });
      return;
    }

    // Store in localStorage for the main screen to pick up
    const exportData = {
      surveyName: surveyName || `Levantamento - ${mindMapTopic}`,
      topic: mindMapTopic,
      items: selectedItems.map(item => ({
        descricao: item.description,
        codigo: item.item_code || '',
        unidade: item.unit,
        quantidade: item.partial_quantity || item.total_quantity,
        valorUnitario: item.unit_price,
        valorTotal: item.total_value,
        local: item.location || '',
        disciplina: item.sector || 'Geral',
        responsavel: technicalInfo.engineer_name || 'Não informado'
      })),
      exportedAt: new Date().toISOString()
    };

    localStorage.setItem('survey_export', JSON.stringify(exportData));
    
    toast({
      title: 'Dados preparados!',
      description: 'Redirecionando para a tela principal...'
    });

    setTimeout(() => navigate('/'), 500);
  };

  const generatePDF = async () => {
    setIsGeneratingPdf(true);
    
    try {
      const selectedItems = items.filter(item => item.is_selected);
      if (selectedItems.length === 0) {
        toast({
          title: 'Selecione itens',
          description: 'Marque os itens que deseja incluir no PDF.',
          variant: 'destructive'
        });
        return;
      }

      // Generate HTML content for PDF
      const htmlContent = generatePDFContent(selectedItems);
      
      // Create and download PDF using browser print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      toast({
        title: 'PDF gerado!',
        description: 'Use o diálogo de impressão para salvar como PDF.'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingPdf(false);
      setPdfDialogOpen(false);
    }
  };

  const generatePDFContent = (selectedItems: SurveyItem[]) => {
    const totalValue = selectedItems.reduce((sum, item) => sum + item.total_value, 0);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Levantamento de Quantitativos</title>
        <style>
          @page { margin: 1.5cm; size: A4; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #333; line-height: 1.4; }
          .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
          .logo-area { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .company-name { font-size: 20px; font-weight: bold; color: #1e40af; }
          .document-title { font-size: 16px; font-weight: bold; margin: 10px 0; color: #1f2937; }
          .project-info { background: #f3f4f6; padding: 12px; border-radius: 6px; margin-bottom: 15px; }
          .project-info p { margin: 4px 0; }
          .project-info strong { color: #1e40af; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10px; }
          th { background: #2563eb; color: white; padding: 10px 6px; text-align: left; font-weight: 600; }
          td { padding: 8px 6px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) { background: #f9fafb; }
          tr:hover { background: #e0e7ff; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-row { background: #1e40af !important; color: white; font-weight: bold; }
          .total-row td { padding: 12px 6px; border: none; }
          .footer { margin-top: 40px; border-top: 2px solid #e5e7eb; padding-top: 20px; }
          .signature-area { display: flex; justify-content: space-between; margin-top: 60px; }
          .signature-box { width: 45%; text-align: center; }
          .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 8px; }
          .signature-name { font-weight: bold; }
          .signature-title { font-size: 10px; color: #666; }
          .crea-badge { background: #dbeafe; padding: 3px 8px; border-radius: 4px; font-size: 9px; color: #1e40af; display: inline-block; margin-top: 5px; }
          .stamp-area { text-align: center; margin-top: 30px; }
          .stamp-placeholder { border: 2px dashed #d1d5db; width: 100px; height: 100px; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 9px; }
          .summary-box { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .summary-box h3 { margin: 0 0 10px 0; font-size: 14px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .summary-item { background: rgba(255,255,255,0.1); padding: 10px; border-radius: 4px; text-align: center; }
          .summary-value { font-size: 18px; font-weight: bold; }
          .summary-label { font-size: 9px; opacity: 0.9; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-area">
            <div class="company-name">${technicalInfo.company_name || 'EMPRESA DE ENGENHARIA'}</div>
            <div style="font-size: 10px; color: #666;">Doc. Nº ${Date.now().toString().slice(-6)}</div>
          </div>
          <div class="document-title">LEVANTAMENTO DE QUANTITATIVOS</div>
        </div>

        <div class="project-info">
          <p><strong>Projeto:</strong> ${technicalInfo.project_name || mindMapTopic}</p>
          <p><strong>Cliente:</strong> ${technicalInfo.client_name || 'Não informado'}</p>
          <p><strong>Data:</strong> ${technicalInfo.date}</p>
          <p><strong>Responsável Técnico:</strong> ${technicalInfo.engineer_name || 'Não informado'}</p>
        </div>

        <div class="summary-box">
          <h3>Resumo do Levantamento</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${selectedItems.length}</div>
              <div class="summary-label">Itens</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${selectedItems.reduce((sum, item) => sum + (item.partial_quantity || item.total_quantity), 0).toLocaleString('pt-BR')}</div>
              <div class="summary-label">Qtd Total</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div class="summary-label">Valor Total</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 8%">Código</th>
              <th style="width: 32%">Descrição</th>
              <th style="width: 8%">Un.</th>
              <th style="width: 10%" class="text-right">Qtd</th>
              <th style="width: 12%" class="text-right">Preço Unit.</th>
              <th style="width: 14%" class="text-right">Valor Total</th>
              <th style="width: 16%">Localização</th>
            </tr>
          </thead>
          <tbody>
            ${selectedItems.map((item, index) => `
              <tr>
                <td>${item.item_code || (index + 1).toString().padStart(3, '0')}</td>
                <td>${item.description}</td>
                <td class="text-center">${item.unit}</td>
                <td class="text-right">${(item.partial_quantity || item.total_quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td class="text-right">R$ ${item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td class="text-right">R$ ${item.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>${[item.location, item.floor_level, item.sector].filter(Boolean).join(' - ') || '-'}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="5" class="text-right">TOTAL GERAL:</td>
              <td class="text-right">R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p style="font-size: 10px; color: #666; margin-bottom: 10px;">
            Este documento foi gerado eletronicamente e possui validade técnica quando assinado pelo responsável.
          </p>
          
          <div class="signature-area">
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-name">${technicalInfo.engineer_name || '________________________'}</div>
                <div class="signature-title">Responsável Técnico</div>
                ${technicalInfo.crea_number ? `<div class="crea-badge">CREA: ${technicalInfo.crea_number}</div>` : ''}
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-name">${technicalInfo.client_name || '________________________'}</div>
                <div class="signature-title">Cliente / Contratante</div>
              </div>
            </div>
          </div>

          <div class="stamp-area">
            <div class="stamp-placeholder">Carimbo<br/>Profissional</div>
          </div>
        </div>
      </body>
      </html>
    `;
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
              <h3 className="font-medium text-card-foreground">Levantamento de Quantitativos</h3>
              <p className="text-sm text-muted-foreground">
                Extraia quantitativos do projeto e gere orçamentos
              </p>
            </div>
            <Badge variant="outline" className="text-card-foreground">Novo</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Levantamento de Quantitativos
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Nome do levantamento (opcional)"
            value={surveyName}
            onChange={(e) => setSurveyName(e.target.value)}
          />

          {/* File Upload */}
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="file"
                id="survey-file-upload"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="survey-file-upload"
                className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploadedFile ? uploadedFile.name : 'Upload projeto (PDF, Word, Excel, TXT)'}
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
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Extrair Quantitativos
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="secondary" size="sm" onClick={addManualItem} className="gap-1">
              <Plus className="h-4 w-4" />
              Adicionar Item
            </Button>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <>
                  <Button variant="ghost" size="sm" onClick={selectAllItems} className="text-card-foreground">
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
            <ScrollArea className="h-[350px]">
              <div className="space-y-3 pr-4">
                {items.map((item) => (
                  <Card key={item.id} className={`p-3 ${item.is_selected ? 'ring-2 ring-primary' : ''}`}>
                    <div className="space-y-3">
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
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Nenhum item adicionado</p>
              <p className="text-sm">Faça upload de um projeto ou adicione itens manualmente</p>
            </div>
          )}

          {/* Summary & Actions */}
          {items.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total dos itens selecionados:
                  </p>
                  <p className="text-xl font-bold text-primary">
                    R$ {getSelectedTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={saveSurvey} disabled={isLoading} variant="outline" className="gap-2 text-foreground">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Salvar
                </Button>
                <Button onClick={() => setPdfDialogOpen(true)} variant="outline" className="gap-2 text-foreground">
                  <Printer className="h-4 w-4" />
                  Gerar PDF
                </Button>
                <Button onClick={exportToMainScreen} className="gap-2">
                  <Send className="h-4 w-4" />
                  Exportar para Tela Principal
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Dialog */}
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileOutput className="h-5 w-5 text-primary" />
              Gerar PDF do Levantamento
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Empresa</Label>
              <Input
                placeholder="Ex: Engenharia & Projetos Ltda"
                value={technicalInfo.company_name}
                onChange={(e) => setTechnicalInfo(prev => ({ ...prev, company_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome do Projeto</Label>
              <Input
                value={technicalInfo.project_name}
                onChange={(e) => setTechnicalInfo(prev => ({ ...prev, project_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Cliente / Contratante</Label>
              <Input
                placeholder="Nome do cliente"
                value={technicalInfo.client_name}
                onChange={(e) => setTechnicalInfo(prev => ({ ...prev, client_name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsável Técnico</Label>
                <Input
                  placeholder="Nome completo"
                  value={technicalInfo.engineer_name}
                  onChange={(e) => setTechnicalInfo(prev => ({ ...prev, engineer_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>CREA / CAU</Label>
                <Input
                  placeholder="000.000/D-XX"
                  value={technicalInfo.crea_number}
                  onChange={(e) => setTechnicalInfo(prev => ({ ...prev, crea_number: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfDialogOpen(false)} className="text-foreground">
              Cancelar
            </Button>
            <Button onClick={generatePDF} disabled={isGeneratingPdf} className="gap-2">
              {isGeneratingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              Gerar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
