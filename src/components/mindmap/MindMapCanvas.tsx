import { useState, useCallback } from 'react';
import { MindMapNode, MindMapData } from '@/types/mindmap';
import { MindMapNodeComponent } from './MindMapNode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Plus, 
  Download, 
  Loader2,
  Brain,
  Lightbulb
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MindMapCanvasProps {
  data: MindMapData | null;
  onDataChange: (data: MindMapData) => void;
  isGenerating: boolean;
}

export const MindMapCanvas = ({ data, onDataChange, isGenerating }: MindMapCanvasProps) => {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const updateNodeRecursive = (
    nodes: MindMapNode[], 
    id: string, 
    updates: Partial<MindMapNode>
  ): MindMapNode[] => {
    return nodes.map(node => {
      if (node.id === id) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return { ...node, children: updateNodeRecursive(node.children, id, updates) };
      }
      return node;
    });
  };

  const deleteNodeRecursive = (nodes: MindMapNode[], id: string): MindMapNode[] => {
    return nodes
      .filter(node => node.id !== id)
      .map(node => ({
        ...node,
        children: node.children ? deleteNodeRecursive(node.children, id) : undefined
      }));
  };

  const addChildRecursive = (nodes: MindMapNode[], parentId: string): MindMapNode[] => {
    return nodes.map(node => {
      if (node.id === parentId) {
        const newChild: MindMapNode = {
          id: generateId(),
          type: 'custom',
          title: 'Novo item',
          description: '',
          children: []
        };
        return {
          ...node,
          children: [...(node.children || []), newChild],
          expanded: true
        };
      }
      if (node.children) {
        return { ...node, children: addChildRecursive(node.children, parentId) };
      }
      return node;
    });
  };

  const handleUpdate = useCallback((id: string, updates: Partial<MindMapNode>) => {
    if (!data) return;
    onDataChange({
      ...data,
      nodes: updateNodeRecursive(data.nodes, id, updates)
    });
  }, [data, onDataChange]);

  const handleDelete = useCallback((id: string) => {
    if (!data) return;
    onDataChange({
      ...data,
      nodes: deleteNodeRecursive(data.nodes, id)
    });
    toast({
      title: 'Item removido',
      description: 'O item foi removido do mapa mental.'
    });
  }, [data, onDataChange, toast]);

  const handleAddChild = useCallback((parentId: string) => {
    if (!data) return;
    onDataChange({
      ...data,
      nodes: addChildRecursive(data.nodes, parentId)
    });
  }, [data, onDataChange]);

  const handleAddRootNode = (type: MindMapNode['type']) => {
    if (!data) return;
    const newNode: MindMapNode = {
      id: generateId(),
      type,
      title: type === 'methodology' ? 'Nova Metodologia' :
             type === 'tpu' ? 'Novo Código TPU' :
             type === 'attention' ? 'Novo Ponto de Atenção' :
             type === 'calculation' ? 'Nova Fórmula' : 'Novo Item',
      description: '',
      children: []
    };
    onDataChange({
      ...data,
      nodes: [...data.nodes, newNode]
    });
  };

  if (isGenerating) {
    return (
      <Card className="flex-1 flex items-center justify-center min-h-[400px]">
        <CardContent className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-primary/10 rounded-full p-6 mb-4 mx-auto w-fit">
              <Brain className="h-12 w-12 text-primary animate-pulse" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-card-foreground">Gerando Mapa Mental com IA</h3>
          <p className="text-sm text-card-foreground/70">
            Analisando o serviço e criando estrutura de medição...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <Card className="flex-1 flex items-center justify-center min-h-[400px]">
        <CardContent className="text-center max-w-md">
          <div className="bg-muted/50 rounded-full p-6 mb-4 mx-auto w-fit">
            <Lightbulb className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-card-foreground">Comece seu Mapa Mental</h3>
          <p className="text-sm text-card-foreground/70 mb-4">
            Digite um serviço de engenharia na barra acima e clique em "Gerar com IA" 
            para criar automaticamente um mapa de medição.
          </p>
          <p className="text-xs text-card-foreground/60">
            Exemplos: "Revestimento cerâmico", "Pintura externa", "Alvenaria estrutural"
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group nodes by type
  const groupedNodes = {
    main: data.nodes.filter(n => n.type === 'main'),
    methodology: data.nodes.filter(n => n.type === 'methodology'),
    tpu: data.nodes.filter(n => n.type === 'tpu'),
    attention: data.nodes.filter(n => n.type === 'attention'),
    calculation: data.nodes.filter(n => n.type === 'calculation'),
    custom: data.nodes.filter(n => n.type === 'custom')
  };

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Topic Header */}
      <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-full p-3">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-card-foreground">{data.topic}</h2>
              <p className="text-sm text-card-foreground/70">
                {data.nodes.length} itens no mapa • Criado em {data.createdAt.toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add buttons */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => handleAddRootNode('methodology')}>
          <Plus className="h-3 w-3 mr-1" />
          Metodologia
        </Button>
        <Button size="sm" variant="secondary" onClick={() => handleAddRootNode('tpu')}>
          <Plus className="h-3 w-3 mr-1" />
          TPU/SINAPI
        </Button>
        <Button size="sm" variant="secondary" onClick={() => handleAddRootNode('attention')}>
          <Plus className="h-3 w-3 mr-1" />
          Atenção
        </Button>
        <Button size="sm" variant="secondary" onClick={() => handleAddRootNode('calculation')}>
          <Plus className="h-3 w-3 mr-1" />
          Cálculo
        </Button>
      </div>

      {/* Mind Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Methodology Column */}
        {groupedNodes.methodology.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-card-foreground">
                <div className="bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-lg p-1.5">
                  <Sparkles className="h-4 w-4" />
                </div>
                Metodologia de Medição
                <Badge variant="outline" className="ml-auto">
                  {groupedNodes.methodology.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[400px] pr-2">
                {groupedNodes.methodology.map(node => (
                  <MindMapNodeComponent
                    key={node.id}
                    node={node}
                    level={0}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onAddChild={handleAddChild}
                  />
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* TPU Column */}
        {groupedNodes.tpu.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-card-foreground">
                <div className="bg-green-500/20 text-green-700 dark:text-green-300 rounded-lg p-1.5">
                  <Sparkles className="h-4 w-4" />
                </div>
                Códigos TPU/SINAPI
                <Badge variant="outline" className="ml-auto">
                  {groupedNodes.tpu.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[400px] pr-2">
                {groupedNodes.tpu.map(node => (
                  <MindMapNodeComponent
                    key={node.id}
                    node={node}
                    level={0}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onAddChild={handleAddChild}
                  />
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Attention Column */}
        {groupedNodes.attention.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-card-foreground">
                <div className="bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg p-1.5">
                  <Sparkles className="h-4 w-4" />
                </div>
                Pontos de Atenção
                <Badge variant="outline" className="ml-auto">
                  {groupedNodes.attention.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[400px] pr-2">
                {groupedNodes.attention.map(node => (
                  <MindMapNodeComponent
                    key={node.id}
                    node={node}
                    level={0}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onAddChild={handleAddChild}
                  />
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Calculation Column */}
        {groupedNodes.calculation.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-card-foreground">
                <div className="bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-lg p-1.5">
                  <Sparkles className="h-4 w-4" />
                </div>
                Memória de Cálculo
                <Badge variant="outline" className="ml-auto">
                  {groupedNodes.calculation.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[400px] pr-2">
                {groupedNodes.calculation.map(node => (
                  <MindMapNodeComponent
                    key={node.id}
                    node={node}
                    level={0}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onAddChild={handleAddChild}
                  />
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Custom items */}
        {groupedNodes.custom.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-card-foreground">
                Itens Personalizados
                <Badge variant="outline" className="ml-auto">
                  {groupedNodes.custom.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[300px] pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {groupedNodes.custom.map(node => (
                    <MindMapNodeComponent
                      key={node.id}
                      node={node}
                      level={0}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      onAddChild={handleAddChild}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
