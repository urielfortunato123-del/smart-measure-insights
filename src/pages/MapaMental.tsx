import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Brain, Sparkles, Loader2, History, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { MindMapCanvas } from '@/components/mindmap/MindMapCanvas';
import { MindMapData, MindMapNode } from '@/types/mindmap';

const STORAGE_KEY = 'mindmap_history';

const MapaMental = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentMap, setCurrentMap] = useState<MindMapData | null>(null);
  const [history, setHistory] = useState<MindMapData[]>([]);

  // Load history from localStorage
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

  // Save history to localStorage
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
      
      // Add to history
      const newHistory = [newMap, ...history.slice(0, 9)]; // Keep last 10
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
    // Update in history
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Mapa Mental de Medições</h1>
              <p className="text-xs text-muted-foreground">
                Gere guias de medição com IA
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Input and History */}
          <div className="lg:col-span-1 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="space-y-4 pr-4">
                {/* Input Card */}
                <Card className="overflow-hidden">
                  <CardContent className="p-4 space-y-4">
                    <div className="w-full">
                      <label className="text-sm font-medium mb-2 block text-card-foreground">
                        Serviço de Engenharia
                      </label>
                      <Textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Ex: Revestimento cerâmico"
                        className="min-h-[60px] resize-none w-full"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            generateMindMap();
                          }
                        }}
                      />
                    </div>
                    
                    <Button 
                      className="w-full gap-2" 
                      onClick={generateMindMap}
                      disabled={isGenerating || !topic.trim()}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Gerar com IA
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-card-foreground/70 text-center">
                      A IA criará metodologia, códigos TPU, pontos de atenção e fórmulas de cálculo.
                    </p>
                  </CardContent>
                </Card>

                {/* History */}
                {history.length > 0 && (
                  <Card className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <History className="h-4 w-4 text-card-foreground/70" />
                        <h3 className="text-sm font-medium text-card-foreground">Histórico</h3>
                      </div>
                      <div className="space-y-2">
                        {history.map((map) => (
                          <div 
                            key={map.id}
                            className={`group p-2 rounded-lg border cursor-pointer transition-colors ${
                              currentMap?.id === map.id 
                                ? 'bg-primary/10 border-primary/50' 
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => loadFromHistory(map)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <p className="text-sm font-medium truncate text-card-foreground">{map.topic}</p>
                                <p className="text-xs text-card-foreground/70">
                                  {map.nodes.length} itens • {map.createdAt.toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFromHistory(map.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Main Canvas */}
          <div className="lg:col-span-3">
            <MindMapCanvas 
              data={currentMap}
              onDataChange={handleMapChange}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapaMental;
