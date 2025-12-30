import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, FileSpreadsheet, Check, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TPUEntry } from '@/types/tpu';
import { MeasurementEntry } from '@/types/measurement';
import { ComparisonType } from '@/types/comparison';
import { parseTPUExcel } from '@/lib/tpuParser';
import { parseExcelData } from '@/lib/excelParser';
import * as XLSX from 'xlsx';

interface FileData {
  name: string;
  entries: TPUEntry[] | MeasurementEntry[];
}

interface ComparisonUploaderProps {
  onCompare: (
    base: TPUEntry[] | MeasurementEntry[],
    comparacao: TPUEntry[] | MeasurementEntry[],
    tipo: ComparisonType,
    nomeBase: string,
    nomeComparacao: string
  ) => void;
}

export const ComparisonUploader = ({ onCompare }: ComparisonUploaderProps) => {
  const [tipo, setTipo] = useState<ComparisonType>('tpu');
  const [fileBase, setFileBase] = useState<FileData | null>(null);
  const [fileComparacao, setFileComparacao] = useState<FileData | null>(null);
  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingComparacao, setLoadingComparacao] = useState(false);
  
  const fileInputBaseRef = useRef<HTMLInputElement>(null);
  const fileInputComparacaoRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseFile = async (file: File, comparisonType: ComparisonType): Promise<FileData | null> => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      if (comparisonType === 'tpu') {
        const result = parseTPUExcel(workbook);
        if (result.entries.length === 0) {
          throw new Error('Nenhum item TPU encontrado');
        }
        return { name: file.name, entries: result.entries };
      } else {
        const entries = parseExcelData(workbook);
        if (entries.length === 0) {
          throw new Error('Nenhum item de medição encontrado');
        }
        return { name: file.name, entries };
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      throw error;
    }
  };

  const handleFileBase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoadingBase(true);
    try {
      const data = await parseFile(file, tipo);
      setFileBase(data);
      toast({
        title: 'Arquivo base carregado',
        description: `${data?.entries.length} itens encontrados`
      });
    } catch (error) {
      toast({
        title: 'Erro ao processar arquivo',
        description: error instanceof Error ? error.message : 'Verifique o formato do arquivo',
        variant: 'destructive'
      });
    } finally {
      setLoadingBase(false);
    }
  };

  const handleFileComparacao = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoadingComparacao(true);
    try {
      const data = await parseFile(file, tipo);
      setFileComparacao(data);
      toast({
        title: 'Arquivo de comparação carregado',
        description: `${data?.entries.length} itens encontrados`
      });
    } catch (error) {
      toast({
        title: 'Erro ao processar arquivo',
        description: error instanceof Error ? error.message : 'Verifique o formato do arquivo',
        variant: 'destructive'
      });
    } finally {
      setLoadingComparacao(false);
    }
  };

  const handleCompare = () => {
    if (!fileBase || !fileComparacao) return;
    
    onCompare(
      fileBase.entries,
      fileComparacao.entries,
      tipo,
      fileBase.name,
      fileComparacao.name
    );
  };

  const clearFiles = () => {
    setFileBase(null);
    setFileComparacao(null);
    if (fileInputBaseRef.current) fileInputBaseRef.current.value = '';
    if (fileInputComparacaoRef.current) fileInputComparacaoRef.current.value = '';
  };

  const handleTipoChange = (newTipo: ComparisonType) => {
    setTipo(newTipo);
    clearFiles();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Selecionar Arquivos para Comparação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de comparação */}
        <div className="space-y-2">
          <Label>Tipo de Comparação</Label>
          <Select value={tipo} onValueChange={(v) => handleTipoChange(v as ComparisonType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tpu">TPU / Base de Preços</SelectItem>
              <SelectItem value="medicao">Medições</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {tipo === 'tpu' 
              ? 'Compare tabelas de preços unitários de diferentes períodos (DER, DNIT, SINAPI)'
              : 'Compare medições de diferentes períodos para analisar evolução da obra'
            }
          </p>
        </div>

        {/* Upload containers */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
          {/* Arquivo Base */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Período Base (Anterior)</Label>
            <input
              ref={fileInputBaseRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileBase}
              className="hidden"
              id="file-base"
            />
            
            {!fileBase ? (
              <label 
                htmlFor="file-base"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors min-h-[120px]"
              >
                {loadingBase ? (
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground text-center">
                      {tipo === 'tpu' ? 'TPU Período Base' : 'Medição Anterior'}
                    </span>
                    <span className="text-xs text-muted-foreground">.xlsx, .xls</span>
                  </>
                )}
              </label>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-success/10 border border-success/30 rounded-lg">
                <Check className="h-5 w-5 text-success shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileBase.name}</p>
                  <p className="text-xs text-muted-foreground">{fileBase.entries.length} itens</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 shrink-0"
                  onClick={() => {
                    setFileBase(null);
                    if (fileInputBaseRef.current) fileInputBaseRef.current.value = '';
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          {/* Arquivo Comparação */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Período Comparação (Atual)</Label>
            <input
              ref={fileInputComparacaoRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileComparacao}
              className="hidden"
              id="file-comparacao"
            />
            
            {!fileComparacao ? (
              <label 
                htmlFor="file-comparacao"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors min-h-[120px]"
              >
                {loadingComparacao ? (
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground text-center">
                      {tipo === 'tpu' ? 'TPU Período Atual' : 'Medição Atual'}
                    </span>
                    <span className="text-xs text-muted-foreground">.xlsx, .xls</span>
                  </>
                )}
              </label>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-success/10 border border-success/30 rounded-lg">
                <Check className="h-5 w-5 text-success shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileComparacao.name}</p>
                  <p className="text-xs text-muted-foreground">{fileComparacao.entries.length} itens</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 shrink-0"
                  onClick={() => {
                    setFileComparacao(null);
                    if (fileInputComparacaoRef.current) fileInputComparacaoRef.current.value = '';
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            className="flex-1"
            onClick={handleCompare}
            disabled={!fileBase || !fileComparacao}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Comparar Arquivos
          </Button>
          {(fileBase || fileComparacao) && (
            <Button variant="outline" onClick={clearFiles}>
              Limpar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
