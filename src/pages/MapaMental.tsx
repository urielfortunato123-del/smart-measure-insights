import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ArrowLeft, Brain, Sparkles, Loader2, History, Trash2, Upload, File, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { MindMapCanvas } from '@/components/mindmap/MindMapCanvas';
import { MindMapData } from '@/types/mindmap';

const STORAGE_KEY = 'mindmap_history';

const MapaMental = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentMap, setCurrentMap] = useState<MindMapData | null>(null);
  const [history, setHistory] = useState<MindMapData[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).filter(file => {
        const ext = file.name.toLowerCase().split('.').pop();
        return ['dwg', 'pdf', 'doc', 'docx'].includes(ext || '');
      });
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        })));
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
  }, []);

  const saveHistory = (newHistory: MindMapData[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    setHistory(newHistory);
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const generateMindMap = async () => {
    if (!topic.trim()) {
      toast({
        title: 'Digite um serviço',
        description: 'Informe o serviço de engenharia para gerar o mapa mental.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-mindmap`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ topic: topic.trim() }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar mapa mental');
      }

      const data = await response.json();
      
      const newMap: MindMapData = {
        id: `map-${Date.now()}`,
        topic: topic.trim(),
        createdAt: new Date(),
        nodes: data.nodes || []
      };

      setCurrentMap(newMap);
      const newHistory = [newMap, ...history.slice(0, 9)];
      saveHistory(newHistory);

      toast({
        title: 'Mapa mental gerado!',
        description: `${data.nodes?.length || 0} itens criados para "${topic}"`
      });
    } catch (error) {
      console.error('Error generating mind map:', error);
      toast({
        title: 'Erro ao gerar mapa',
        description: error instanceof Error ? error.message : 'Tente novamente em alguns segundos.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMapChange = (data: MindMapData) => {
    setCurrentMap(data);
    const newHistory = history.map(h => h.id === data.id ? data : h);
    saveHistory(newHistory);
  };

  const loadFromHistory = (map: MindMapData) => {
    setCurrentMap(map);
    setTopic(map.topic);
    setIsHistoryOpen(false);
  };

  const deleteFromHistory = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    saveHistory(newHistory);
    if (currentMap?.id === id) {
      setCurrentMap(null);
    }
    toast({
      title: 'Mapa removido',
      description: 'O mapa foi removido do histórico.'
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Compact Header */}
      <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Brain className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold hidden sm:inline">Mapa Mental de Medições</span>
            </div>
          </div>

          {/* History Button */}
          <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Histórico</span>
                {history.length > 0 && (
                  <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">
                    {history.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-80 sm:w-96">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Mapas
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-3">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum mapa no histórico ainda.
                  </p>
                ) : (
                  history.map((map) => (
                    <div 
                      key={map.id}
                      className={`group p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                        currentMap?.id === map.id 
                          ? 'bg-primary/10 border-primary/50' 
                          : 'hover:bg-muted border-border'
                      }`}
                      onClick={() => loadFromHistory(map)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{map.topic}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {map.nodes.length} itens • {map.createdAt.toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFromHistory(map.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Fullscreen Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <MindMapCanvas 
          data={currentMap}
          onDataChange={handleMapChange}
          isGenerating={isGenerating}
        />

        {/* Floating Control Panel */}
        <Card className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl shadow-2xl border-0 bg-card/95 backdrop-blur-xl transition-all duration-300 animate-fade-in ${isPanelExpanded ? 'rounded-2xl' : 'rounded-full'}`}>
          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 px-3 rounded-full bg-card shadow-md border"
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
          >
            {isPanelExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </Button>

          {isPanelExpanded ? (
            <div className="p-4 space-y-3">
              {/* Input Row */}
              <div className="flex gap-3">
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Digite o serviço de engenharia... Ex: Revestimento cerâmico, Pintura externa"
                  className="min-h-[44px] max-h-[80px] resize-none flex-1 rounded-xl border-muted"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      generateMindMap();
                    }
                  }}
                />
                <Button 
                  className="gap-2 rounded-xl px-6 h-auto"
                  onClick={generateMindMap}
                  disabled={isGenerating || !topic.trim()}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{isGenerating ? 'Gerando...' : 'Gerar com IA'}</span>
                </Button>
              </div>

              {/* File Upload Row */}
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".dwg,.pdf,.doc,.docx"
                  multiple
                  onChange={handleFileAttach}
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-border/60 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Anexar arquivos</span>
                </label>

                {attachedFiles.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap flex-1">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-lg text-xs">
                        <File className="h-3 w-3 text-primary" />
                        <span className="max-w-[100px] truncate">{file.name}</span>
                        <button onClick={() => removeFile(index)} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="px-6 py-3 flex items-center justify-center gap-3">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {currentMap ? currentMap.topic : 'Clique para criar um mapa mental'}
              </span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MapaMental;