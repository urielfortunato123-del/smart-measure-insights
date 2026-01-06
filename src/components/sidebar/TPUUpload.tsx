import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, Database, X, Loader2, FileText, FileSpreadsheet, Check, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TPUEntry, TPUImportResult } from '@/types/tpu';
import { parseTPUExcel, parseTPUFromText, formatTPUPrice } from '@/lib/tpuParser';
import * as XLSX from 'xlsx';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { processFileForOCR, cleanOCRText, OCRMode } from '@/lib/ocrService';
import { OCRModeSelector } from './OCRModeSelector';

interface TPUUploadProps {
  onTPULoaded: (entries: TPUEntry[]) => void;
}

type TPUOrigem = 'DER-SP' | 'DNIT' | 'SINAPI' | 'Outro';
type TPUTipo = 'desonerado' | 'nao_desonerado';

export const TPUUpload = ({ onTPULoaded }: TPUUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [origem, setOrigem] = useState<TPUOrigem>('DER-SP');
  const [tipo, setTipo] = useState<TPUTipo>('nao_desonerado');
  const [importResult, setImportResult] = useState<TPUImportResult | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrMode, setOcrMode] = useState<OCRMode>('auto');
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileName = selectedFile.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isPDF = fileName.endsWith('.pdf');
    const isImage = selectedFile.type.startsWith('image/');

    if (!isExcel && !isPDF && !isImage) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione um arquivo .xlsx, .xls, .pdf ou imagem',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setFile(selectedFile);

    try {
      let result: TPUImportResult;

      if (isExcel) {
        // Parse Excel file
        const data = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        result = parseTPUExcel(workbook);
      } else if (isImage || isPDF) {
        // Use OCR for images and PDFs
        setIsOcrProcessing(true);
        setOcrProgress(0);
        
        toast({
          title: isImage ? 'Processando imagem...' : 'Processando PDF...',
          description: 'Usando OCR para extrair texto',
        });

        try {
          const ocrResult = await processFileForOCR(
            selectedFile,
            (progress) => setOcrProgress(progress),
            ocrMode
          );
          
          // If PDF needs AI directly, show message
          if (ocrResult.text === '__PDF_USE_AI_DIRECTLY__') {
            toast({
              title: 'PDF detectado',
              description: 'PDFs serão processados diretamente pela IA. Use Excel para melhor precisão.',
              variant: 'default'
            });
            setIsLoading(false);
            setIsOcrProcessing(false);
            setFile(null);
            return;
          }
          
          const cleanedText = cleanOCRText(ocrResult.text);
          result = parseTPUFromText(cleanedText);
          
          toast({
            title: 'OCR concluído!',
            description: `Confiança: ${ocrResult.confidence.toFixed(0)}% (${ocrResult.method})`,
          });
        } catch (ocrError) {
          console.error('OCR error:', ocrError);
          toast({
            title: 'Erro no OCR',
            description: 'Não foi possível processar o arquivo. Tente outro formato.',
            variant: 'destructive'
          });
          setIsLoading(false);
          setIsOcrProcessing(false);
          setFile(null);
          return;
        } finally {
          setIsOcrProcessing(false);
          setOcrProgress(0);
        }
      } else {
        throw new Error('Formato não suportado');
      }

      // Update tipo based on detection
      if (result.tipo) {
        setTipo(result.tipo);
      }

      setImportResult(result);

      if (result.entries.length > 0) {
        toast({
          title: 'TPU carregada',
          description: `${result.totalItems} itens encontrados (${result.tipo === 'desonerado' ? 'Desonerado' : 'Não Desonerado'})`
        });
      } else {
        toast({
          title: 'Nenhum item encontrado',
          description: 'Verifique se o arquivo está no formato correto da TPU',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error parsing TPU:', error);
      toast({
        title: 'Erro ao processar arquivo',
        description: 'Verifique se o arquivo está no formato correto',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (!importResult || importResult.entries.length === 0) return;

    // Update entries with selected origem and tipo
    const updatedEntries = importResult.entries.map(entry => ({
      ...entry,
      origem,
      tipo
    }));

    onTPULoaded(updatedEntries);

    toast({
      title: 'TPU importada com sucesso!',
      description: `${updatedEntries.length} itens de preço unitário carregados`
    });
  };

  const handleClear = () => {
    setFile(null);
    setImportResult(null);
    setOrigem('DER-SP');
    setTipo('nao_desonerado');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="border-border max-w-[180px]">
      <CardHeader className="pb-1 px-2 py-2">
        <CardTitle className="text-xs font-medium flex items-center gap-1">
          <Database className="h-3 w-3 text-primary" />
          <span className="truncate">Importar TPU / Base de Preços</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-2 pb-2">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.pdf,image/*"
            onChange={handleFileChange}
            className="hidden"
            id="tpu-upload"
          />
          
          {/* OCR Mode Selector */}
          <OCRModeSelector
            value={ocrMode}
            onChange={setOcrMode}
            disabled={isLoading || isOcrProcessing}
          />

          {/* OCR Progress */}
          {isOcrProcessing && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Processando OCR...</span>
                <span className="text-primary">{ocrProgress}%</span>
              </div>
              <Progress value={ocrProgress} className="h-1" />
            </div>
          )}

          {!file ? (
            <label 
              htmlFor="tpu-upload"
              className="flex flex-col items-center justify-center p-2 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin mb-1" />
              ) : (
                <Upload className="h-4 w-4 text-muted-foreground mb-1" />
              )}
              <span className="text-[10px] text-muted-foreground text-center">
                Clique para upload
              </span>
              <span className="text-[10px] text-muted-foreground text-center">
                .xlsx, .pdf, imagem
              </span>
            </label>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
              {file.name.endsWith('.pdf') ? (
                <FileText className="h-5 w-5 text-destructive shrink-0" />
              ) : (
                <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
              )}
              <span className="text-sm truncate flex-1">{file.name}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 shrink-0"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {importResult && importResult.entries.length > 0 && (
          <>
            <div className="p-2 bg-success/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="text-xs text-success font-medium">
                  {importResult.totalItems} itens encontrados
                </span>
              </div>
              {importResult.dataReferencia && (
                <p className="text-xs text-muted-foreground mt-1">
                  Referência: {importResult.dataReferencia}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Origem da Tabela</Label>
              <Select value={origem} onValueChange={(v) => setOrigem(v as TPUOrigem)}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DER-SP">DER-SP</SelectItem>
                  <SelectItem value="DNIT">DNIT</SelectItem>
                  <SelectItem value="SINAPI">SINAPI</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Tipo de Tabela</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TPUTipo)}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao_desonerado">Não Desonerado</SelectItem>
                  <SelectItem value="desonerado">Desonerado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-xs">Preview dos Itens</Label>
              <ScrollArea className="h-[120px] border border-border rounded-lg">
                <div className="p-2 space-y-1">
                  {importResult.entries.slice(0, 5).map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-muted/30 rounded">
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-primary">{entry.codigo}</span>
                        <span className="mx-2 text-muted-foreground">-</span>
                        <span className="truncate">{entry.nome.substring(0, 30)}...</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] ml-2 shrink-0">
                        {formatTPUPrice(entry.precoUnitario)}
                      </Badge>
                    </div>
                  ))}
                  {importResult.entries.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground pt-1">
                      +{importResult.entries.length - 5} itens...
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleImport}
                disabled={isLoading}
              >
                Importar TPU
              </Button>
              <Button variant="outline" onClick={handleClear}>
                Limpar
              </Button>
            </div>
          </>
        )}

        {file && !importResult && !isLoading && (
          <div className="flex gap-2">
            <Button className="flex-1" disabled>
              Importar TPU
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Limpar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
