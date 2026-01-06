import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileSpreadsheet, 
  Sparkles, 
  ArrowLeft,
  Loader2,
  RefreshCw,
  Image,
  ScanLine
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { ExcelSpreadsheet } from '@/components/analysis/ExcelSpreadsheet';
import { AnalysisSummary } from '@/components/analysis/AnalysisSummary';
import { OCRModeSelector, OCRMode } from '@/components/sidebar/OCRModeSelector';
import { processFileForOCR, cleanOCRText } from '@/lib/ocrService';

export interface CellError {
  row: number;
  col: number;
  type: 'calculation' | 'inconsistent' | 'duplicate' | 'missing';
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface AnalysisResult {
  errors: CellError[];
  summary: {
    totalRows: number;
    totalErrors: number;
    calculationErrors: number;
    inconsistentValues: number;
    duplicates: number;
    missingData: number;
  };
}

const Analise = () => {
  const [data, setData] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [ocrMode, setOcrMode] = useState<OCRMode>('auto');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    
    try {
      // Handle image files with OCR
      if (isImage) {
        setIsOcrProcessing(true);
        setOcrProgress(0);
        
        toast({
          title: 'Processando imagem...',
          description: 'Usando OCR para extrair tabela',
        });

        try {
          const ocrResult = await processFileForOCR(
            file,
            (progress) => setOcrProgress(progress),
            ocrMode
          );
          
          const cleanedText = cleanOCRText(ocrResult.text);
          
          // Try to parse as table (basic CSV-like parsing)
          const lines = cleanedText.split('\n').filter(l => l.trim());
          if (lines.length > 0) {
            const parsedData = lines.map(line => 
              line.split(/\s{2,}|\t/).map(cell => cell.trim())
            );
            
            if (parsedData.length > 0) {
              setHeaders(parsedData[0].map(String));
              setData(parsedData.slice(1));
              setFileName(file.name);
              setAnalysisResult(null);
              
              toast({
                title: "Texto extraído via OCR!",
                description: `${parsedData.length - 1} linhas extraídas. Confiança: ${ocrResult.confidence.toFixed(0)}%`,
              });
            }
          } else {
            throw new Error('Não foi possível extrair tabela da imagem');
          }
        } catch (ocrError) {
          console.error('OCR error:', ocrError);
          toast({
            title: "Erro no OCR",
            description: ocrError instanceof Error ? ocrError.message : "Falha ao processar imagem",
            variant: "destructive"
          });
        } finally {
          setIsOcrProcessing(false);
          setOcrProgress(0);
        }
        return;
      }

      // Handle Excel/CSV files
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
      
      if (jsonData.length > 0) {
        setHeaders(jsonData[0].map(String));
        setData(jsonData.slice(1));
        setFileName(file.name);
        setAnalysisResult(null);
        
        toast({
          title: "Planilha carregada!",
          description: `${jsonData.length - 1} linhas importadas de ${file.name}`,
        });
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: "Erro ao carregar arquivo",
        description: "Verifique se o arquivo é uma planilha válida.",
        variant: "destructive"
      });
    }
  }, [toast, ocrMode]);

  const runAIAnalysis = async () => {
    if (data.length === 0) return;
    
    setIsAnalyzing(true);
    
    try {
      // Prepare data for analysis
      const dataForAnalysis = data.map((row, rowIndex) => {
        const item: Record<string, any> = { _rowIndex: rowIndex };
        headers.forEach((header, colIndex) => {
          item[header] = row[colIndex];
        });
        return item;
      });

      // Call edge function for AI analysis
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-spreadsheet`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            data: dataForAnalysis,
            headers: headers
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Erro na análise');
      }

      const result = await response.json();
      setAnalysisResult(result);
      
      toast({
        title: "Análise concluída!",
        description: `Encontrados ${result.summary.totalErrors} problemas na planilha.`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar a planilha. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDataChange = (newData: any[][]) => {
    setData(newData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Análise Inteligente</h1>
            </div>
          </div>
          
          {fileName && (
            <div className="flex items-center gap-3">
              <Badge variant="outline">{fileName}</Badge>
              <Button 
                onClick={runAIAnalysis} 
                disabled={isAnalyzing || data.length === 0}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analisar com IA
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto p-4">
        {/* Upload Area */}
        {data.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-lg border-dashed border-2 hover:border-primary/50 transition-colors">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative bg-primary/10 rounded-full p-6">
                    <Upload className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold mt-6 mb-2 text-card-foreground">Carregar Planilha ou Imagem</h2>
                <p className="text-card-foreground/70 text-center mb-4 max-w-sm">
                  Arraste um arquivo ou clique para selecionar. 
                  Suporta Excel (.xlsx, .xls), CSV e imagens com OCR.
                </p>
                
                {/* OCR Mode Selector */}
                <div className="mb-4 w-full max-w-xs">
                  <OCRModeSelector
                    value={ocrMode}
                    onChange={setOcrMode}
                    disabled={isOcrProcessing}
                  />
                </div>

                {/* OCR Progress */}
                {isOcrProcessing && (
                  <div className="w-full max-w-xs mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <ScanLine className="h-4 w-4 animate-pulse" />
                        Processando OCR...
                      </span>
                      <span className="text-primary font-medium">{ocrProgress}%</span>
                    </div>
                    <Progress value={ocrProgress} className="h-2" />
                  </div>
                )}

                <label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isOcrProcessing}
                  />
                  <Button asChild disabled={isOcrProcessing}>
                    <span className="cursor-pointer gap-2">
                      {isOcrProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4" />
                      )}
                      Selecionar Arquivo
                    </span>
                  </Button>
                </label>
                
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <Image className="h-3 w-3" />
                  <span>Imagens serão processadas com OCR</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Analysis Summary Panel */}
            <div className="lg:col-span-1">
              <AnalysisSummary 
                result={analysisResult} 
                isAnalyzing={isAnalyzing}
                onReanalyze={runAIAnalysis}
              />
              
              {/* Upload new file */}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <label className="w-full">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button variant="secondary" asChild className="w-full">
                      <span className="cursor-pointer gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Carregar Nova Planilha
                      </span>
                    </Button>
                  </label>
                </CardContent>
              </Card>
            </div>
            
            {/* Spreadsheet Grid */}
            <div className="lg:col-span-3">
              <Card className="overflow-hidden">
                <CardHeader className="py-3 px-4 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      {fileName}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{data.length} linhas</span>
                      <span>•</span>
                      <span>{headers.length} colunas</span>
                    </div>
                  </div>
                </CardHeader>
                <ExcelSpreadsheet
                  headers={headers}
                  data={data}
                  errors={analysisResult?.errors || []}
                  onDataChange={handleDataChange}
                />
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analise;
