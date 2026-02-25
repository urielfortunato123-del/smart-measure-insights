import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Code, Copy, Check, FileText, Download } from 'lucide-react';

interface MarkdownPreviewProps {
  text: string;
  fileName?: string;
  confidence?: number;
  method?: 'local' | 'cloud' | 'mistral';
  format?: 'plain' | 'markdown';
  pagesProcessed?: number;
  onClose?: () => void;
  className?: string;
}

export const MarkdownPreview = ({
  text,
  fileName,
  confidence,
  method,
  format,
  pagesProcessed,
  onClose,
  className = '',
}: MarkdownPreviewProps) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(format === 'markdown' ? 'preview' : 'raw');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = format === 'markdown' ? 'md' : 'txt';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName ? `${fileName.replace(/\.[^.]+$/, '')}.${ext}` : `ocr-result.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const methodLabel = method === 'mistral' ? 'Mistral' : method === 'cloud' ? 'Cloud' : 'Local';

  return (
    <Card className={`border-border ${className}`}>
      <CardHeader className="pb-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="truncate">Texto Extraído</span>
          </CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            {method && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {methodLabel}
              </Badge>
            )}
            {confidence != null && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {confidence.toFixed(0)}%
              </Badge>
            )}
            {pagesProcessed != null && pagesProcessed > 1 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {pagesProcessed} págs
              </Badge>
            )}
          </div>
        </div>
        {fileName && (
          <p className="text-xs text-muted-foreground truncate mt-1">{fileName}</p>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between gap-2">
            <TabsList className="h-7">
              <TabsTrigger value="preview" className="text-xs h-6 px-2 gap-1">
                <Eye className="h-3 w-3" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="raw" className="text-xs h-6 px-2 gap-1">
                <Code className="h-3 w-3" />
                Raw
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} title="Copiar">
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload} title="Baixar">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <TabsContent value="preview" className="mt-2">
            <ScrollArea className="h-[300px] rounded-md border border-border p-3">
              <div className="prose prose-sm dark:prose-invert max-w-none
                prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5
                prose-p:text-foreground prose-p:my-1
                prose-table:text-xs prose-table:border-collapse
                prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-2 prose-th:py-1 prose-th:text-left prose-th:font-medium prose-th:text-foreground
                prose-td:border prose-td:border-border prose-td:px-2 prose-td:py-1 prose-td:text-foreground
                prose-li:text-foreground prose-li:my-0.5
                prose-strong:text-foreground
                prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-xs
                prose-hr:border-border prose-hr:my-3
                prose-a:text-primary"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="raw" className="mt-2">
            <ScrollArea className="h-[300px] rounded-md border border-border">
              <pre className="p-3 text-xs font-mono text-foreground whitespace-pre-wrap break-words">
                {text}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {onClose && (
          <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={onClose}>
            Fechar preview
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
