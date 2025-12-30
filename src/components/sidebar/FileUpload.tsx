import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, X, Loader2, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseExcelFile, intelligentColumnMapping, parseSheetData } from '@/lib/excelParser';
import { MeasurementEntry, ParsedSheet, ColumnMapping } from '@/types/measurement';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FileUploadProps {
  onDataLoaded: (data: MeasurementEntry[]) => void;
}

type MeasurementPeriod = 'current' | 'previous' | 'weekly' | 'daily' | 'monthly';

export const FileUpload = ({ onDataLoaded }: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [skipRows, setSkipRows] = useState('0');
  const [selectedSheet, setSelectedSheet] = useState('');
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [workbook, setWorkbook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [measurementPeriod, setMeasurementPeriod] = useState<MeasurementPeriod>('current');
  const [showMapping, setShowMapping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!validTypes.includes(selectedFile.type) && 
        !selectedFile.name.endsWith('.csv') && 
        !selectedFile.name.endsWith('.xlsx') &&
        !selectedFile.name.endsWith('.xls')) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione um arquivo .xlsx ou .csv',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setFile(selectedFile);

    try {
      const result = await parseExcelFile(selectedFile);
      setSheets(result.sheets);
      setWorkbook(result.workbook);
      
      if (result.sheets.length > 0) {
        // Auto-select sheet that looks like measurement data
        const measurementSheet = result.sheets.find(s => 
          s.name.toLowerCase().includes('medição') || 
          s.name.toLowerCase().includes('medicao') ||
          s.name.toLowerCase().includes('boletim') ||
          s.name.toLowerCase().includes('bm')
        ) || result.sheets[0];
        
        setSelectedSheet(measurementSheet.name);
        
        // Use detected skip rows
        if (measurementSheet.suggestedSkipRows !== undefined) {
          setSkipRows(String(measurementSheet.suggestedSkipRows));
        }
        
        // Auto-detect column mapping
        const mapping = intelligentColumnMapping(measurementSheet.columns);
        setColumnMapping(mapping);
      }

      toast({
        title: 'Arquivo carregado',
        description: `${result.sheets.length} planilha(s) encontrada(s) em ${selectedFile.name}`
      });
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: 'Erro ao processar arquivo',
        description: 'Verifique se o arquivo está no formato correto',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    const sheet = sheets.find(s => s.name === sheetName);
    if (sheet) {
      const mapping = intelligentColumnMapping(sheet.columns);
      setColumnMapping(mapping);
      // Update skip rows based on detected type
      if (sheet.suggestedSkipRows !== undefined) {
        setSkipRows(String(sheet.suggestedSkipRows));
      }
    }
  };

  const handleProcess = () => {
    if (!file || !workbook || !selectedSheet || !columnMapping) return;
    
    setIsLoading(true);
    
    try {
      const entries = parseSheetData(
        workbook,
        selectedSheet,
        parseInt(skipRows) || 0,
        columnMapping
      );

      if (entries.length === 0) {
        toast({
          title: 'Nenhum dado encontrado',
          description: 'Verifique o mapeamento de colunas e o número de linhas a pular',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Dados importados com sucesso!',
        description: `${entries.length} registros carregados da planilha "${selectedSheet}"`
      });
      
      onDataLoaded(entries);
    } catch (error) {
      console.error('Error processing data:', error);
      toast({
        title: 'Erro ao processar dados',
        description: 'Verifique o mapeamento de colunas',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setSelectedSheet('');
    setSheets([]);
    setWorkbook(null);
    setColumnMapping(null);
    setSkipRows('0');
    setMeasurementPeriod('current');
    setShowMapping(false);
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Clear imported data in the dashboard as well
    onDataLoaded([]);

    toast({
      title: 'Dados limpos',
      description: 'Você pode selecionar um novo arquivo'
    });
  };

  const currentSheet = sheets.find(s => s.name === selectedSheet);

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          Importar Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          
          {!file ? (
            <label 
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              )}
              <span className="text-sm text-muted-foreground">
                Clique para upload
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                .xlsx, .csv
              </span>
            </label>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
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

        {file && sheets.length > 0 && (
          <>
            {currentSheet?.detectedType && (
              <div className="p-2 bg-primary/10 rounded-lg overflow-hidden">
                <p className="text-xs text-primary font-medium truncate">
                  Tipo detectado: {currentSheet.detectedType}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-xs">Planilha (Aba)</Label>
              <Select value={selectedSheet} onValueChange={handleSheetChange}>
                <SelectTrigger className="bg-secondary/50 w-full">
                  <SelectValue placeholder="Selecione a planilha" className="truncate" />
                </SelectTrigger>
                <SelectContent className="max-w-[280px]">
                  {sheets.map(sheet => (
                    <SelectItem key={sheet.name} value={sheet.name} className="truncate">
                      <span className="truncate block max-w-[240px]">
                        {sheet.name} ({sheet.totalRows})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Período de Medição</Label>
              <Select 
                value={measurementPeriod} 
                onValueChange={(v) => setMeasurementPeriod(v as MeasurementPeriod)}
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Medição Atual</SelectItem>
                  <SelectItem value="previous">Base Anterior</SelectItem>
                  <SelectItem value="daily">Diária</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Ignorar linhas (cabeçalho)</Label>
              <Input
                type="number"
                min="0"
                max="50"
                value={skipRows}
                onChange={(e) => setSkipRows(e.target.value)}
                className="bg-secondary/50"
                placeholder="Ex: 5 para pular logos e títulos"
              />
              <p className="text-xs text-muted-foreground">
                Pule linhas de logo, título do projeto, etc.
              </p>
            </div>

            {columnMapping && currentSheet && (
              <Collapsible open={showMapping} onOpenChange={setShowMapping}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      Mapeamento de Colunas
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {showMapping ? 'Ocultar' : 'Mostrar'}
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(columnMapping).map(([key, value]) => (
                      value && (
                        <div key={key} className="flex flex-col">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="font-medium truncate" title={value}>
                            {value}
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                  {currentSheet.previewRows.length > 0 && (
                    <div className="mt-2 p-2 bg-secondary/30 rounded text-xs">
                      <p className="text-muted-foreground mb-1">Preview (1ª linha de dados):</p>
                      <div className="overflow-x-auto">
                        <div className="flex gap-2">
                          {currentSheet.previewRows[0]?.slice(0, 4).map((cell, i) => (
                            <span key={i} className="bg-background px-2 py-1 rounded truncate max-w-[80px]">
                              {String(cell || '-')}
                            </span>
                          ))}
                          {currentSheet.previewRows[0]?.length > 4 && (
                            <span className="text-muted-foreground">...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}


            {/* Actions */}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleProcess}
                disabled={isLoading || !selectedSheet}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Importar Dados'
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isLoading}
              >
                Limpar
              </Button>
            </div>
          </>
        )}

        {/* If a file is selected but the sheet parsing failed (or CSV without sheets), still allow clearing */}
        {file && sheets.length === 0 && (
          <div className="flex gap-2">
            <Button className="flex-1" disabled>
              Importar Dados
            </Button>
            <Button variant="outline" onClick={handleClear} disabled={isLoading}>
              Limpar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
