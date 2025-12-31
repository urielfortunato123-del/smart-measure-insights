import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, Database, X, Loader2, FileText, FileSpreadsheet, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TPUEntry, TPUImportResult } from '@/types/tpu';
import { parseTPUExcel, parseTPUFromText, formatTPUPrice } from '@/lib/tpuParser';
import * as XLSX from 'xlsx';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileName = selectedFile.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isPDF = fileName.endsWith('.pdf');

    if (!isExcel && !isPDF) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione um arquivo .xlsx, .xls ou .pdf',
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
      } else {
        // For PDF, we need to read as text or use a PDF parser
        // Since we don't have a PDF parser client-side, show info message
        toast({
          title: 'PDF detectado',
          description: 'Para melhor precisão, recomendamos usar o arquivo Excel. PDFs requerem processamento adicional.',
          variant: 'default'
        });
        
        // Try to read PDF as text (basic extraction)
        const text = await selectedFile.text();
        result = parseTPUFromText(text);
        
        if (result.entries.length === 0) {
          toast({
            title: 'PDF não suportado diretamente',
            description: 'Por favor, use o arquivo Excel (.xlsx) para importar a TPU. PDFs binários não podem ser lidos diretamente.',
            variant: 'destructive'
          });
          setIsLoading(false);
          setFile(null);
          return;
        }
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
            accept=".xlsx,.xls,.pdf"
            onChange={handleFileChange}
            className="hidden"
            id="tpu-upload"
          />
          
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
                .xlsx, .pdf (DER, DNIT, SINAPI)
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
