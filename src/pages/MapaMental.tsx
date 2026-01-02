import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Brain, Sparkles, Loader2, History, Trash2, Upload, File, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { MindMapCanvas } from '@/components/mindmap/MindMapCanvas';
import { MindMapData } from '@/types/mindmap';
import { useAppData } from '@/contexts/AppDataContext';

const STORAGE_KEY = 'mindmap_history';

const MapaMental = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setCurrentMindMap: setGlobalMindMap } = useAppData();
  
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentMap, setCurrentMap] = useState<MindMapData | null>(null);
  const [history, setHistory] = useState<MindMapData[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Sync current mind map to global context
  useEffect(() => {
    setGlobalMindMap(currentMap);
  }, [currentMap, setGlobalMindMap]);

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
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="flex h-12 items-center px-4 gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Brain className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold">Mapa Mental de Medições</span>
          </div>
        </div>
      </header>

      {/* Split Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls */}
        <div className="w-1/2 border-r border-border flex flex-col bg-muted/30">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Input Section */}
              <Card className="p-5 space-y-4 border-0 shadow-lg bg-card">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Serviço de Engenharia
                  </label>
                  <Textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex: Revestimento cerâmico, Pintura externa, Alvenaria estrutural..."
                    className="min-h-[100px] resize-none rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        generateMindMap();
                      }
                    }}
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Anexar Arquivos (opcional)</label>
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
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">DWG, PDF, Word</span>
                  </label>

                  {attachedFiles.length > 0 && (
                    <div className="space-y-2">
                      {attachedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
                          <File className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm truncate flex-1">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  className="w-full gap-2 rounded-xl h-12 text-base"
                  onClick={generateMindMap}
                  disabled={isGenerating || !topic.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Gerando mapa mental...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Gerar com IA
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  A IA criará metodologia, códigos TPU, pontos de atenção e fórmulas de cálculo.
                </p>
              </Card>

              {/* History Section */}
              {history.length > 0 && (
                <Card className="p-5 border-0 shadow-lg bg-card">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Histórico</h3>
                  </div>
                  <div className="space-y-2">
                    {history.map((map) => (
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
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Canvas */}
        <div className="w-1/2 bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-sky-900/30 dark:via-blue-900/20 dark:to-indigo-900/30">
          <MindMapCanvas 
            data={currentMap}
            onDataChange={handleMapChange}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  );
};

export default MapaMental;