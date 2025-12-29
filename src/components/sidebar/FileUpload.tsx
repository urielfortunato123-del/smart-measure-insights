import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onDataLoaded: (data: any[]) => void;
}

export const FileUpload = ({ onDataLoaded }: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [skipRows, setSkipRows] = useState('0');
  const [selectedSheet, setSelectedSheet] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile);
        toast({
          title: 'Arquivo selecionado',
          description: `${selectedFile.name} pronto para processamento`
        });
      } else {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, selecione um arquivo .xlsx ou .csv',
          variant: 'destructive'
        });
      }
    }
  };

  const handleProcess = () => {
    if (!file) return;
    
    // In a real implementation, this would parse the Excel file
    // For now, we'll simulate successful loading
    toast({
      title: 'Dados carregados',
      description: `Processando ${file.name} com ${skipRows} linhas ignoradas`
    });
    
    // Trigger sample data load for demo
    onDataLoaded([]);
  };

  const handleClear = () => {
    setFile(null);
    setSelectedSheet('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
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

        {file && (
          <>
            <div className="space-y-2">
              <Label className="text-xs">Planilha</Label>
              <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Selecione a planilha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sheet1">BM Janeiro 2024</SelectItem>
                  <SelectItem value="sheet2">BM Fevereiro 2024</SelectItem>
                  <SelectItem value="sheet3">Resumo Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Ignorar linhas (cabeçalho)</Label>
              <Input
                type="number"
                min="0"
                max="20"
                value={skipRows}
                onChange={(e) => setSkipRows(e.target.value)}
                className="bg-secondary/50"
              />
            </div>

            <Button 
              className="w-full"
              onClick={handleProcess}
            >
              Processar Arquivo
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
