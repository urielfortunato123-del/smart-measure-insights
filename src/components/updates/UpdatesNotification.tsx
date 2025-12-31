import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Rocket, Bug, Wrench, Star, ChevronRight } from 'lucide-react';

export interface UpdateItem {
  id: string;
  version: string;
  date: string;
  title: string;
  description: string;
  type: 'feature' | 'improvement' | 'fix' | 'update';
  details?: string[];
}

// Lista de atualizações - adicione novas atualizações aqui
export const updates: UpdateItem[] = [
  {
    id: 'v1.5.0',
    version: '1.5.0',
    date: '31/12/2024',
    title: 'Análise Inteligente com IA',
    description: 'Nova funcionalidade de análise automática de planilhas com inteligência artificial.',
    type: 'feature',
    details: [
      'Upload de planilhas Excel e CSV',
      'Planilha interativa estilo Excel (editar, copiar, colar)',
      'Detecção automática de erros de cálculo',
      'Identificação de valores inconsistentes (outliers)',
      'Alerta de dados duplicados',
      'Verificação de campos faltantes',
      'Tooltips interativos mostrando explicação dos erros',
    ],
  },
  {
    id: 'v1.4.0',
    version: '1.4.0',
    date: '30/12/2024',
    title: 'Comparação de Medições',
    description: 'Compare duas medições lado a lado para identificar diferenças.',
    type: 'feature',
    details: [
      'Upload de duas planilhas para comparação',
      'Destaque visual das diferenças',
      'Relatório de itens adicionados, removidos e alterados',
    ],
  },
  {
    id: 'v1.3.0',
    version: '1.3.0',
    date: '29/12/2024',
    title: 'Assistente de IA no Dashboard',
    description: 'Chat integrado com IA para tirar dúvidas sobre seus dados.',
    type: 'feature',
    details: [
      'Pergunte sobre seus dados de medição',
      'Receba análises e insights automáticos',
      'Identifique erros rapidamente',
    ],
  },
  {
    id: 'v1.2.0',
    version: '1.2.0',
    date: '28/12/2024',
    title: 'Layout Personalizável',
    description: 'Redimensione e reorganize os painéis do dashboard.',
    type: 'improvement',
    details: [
      'Sidebar redimensionável',
      'Posição da sidebar configurável',
      'Salvamento de preferências',
    ],
  },
];

const getTypeIcon = (type: UpdateItem['type']) => {
  switch (type) {
    case 'feature':
      return <Rocket className="h-4 w-4" />;
    case 'improvement':
      return <Sparkles className="h-4 w-4" />;
    case 'fix':
      return <Bug className="h-4 w-4" />;
    case 'update':
      return <Wrench className="h-4 w-4" />;
  }
};

const getTypeBadge = (type: UpdateItem['type']) => {
  switch (type) {
    case 'feature':
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Novidade</Badge>;
    case 'improvement':
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Melhoria</Badge>;
    case 'fix':
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Correção</Badge>;
    case 'update':
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Atualização</Badge>;
  }
};

const STORAGE_KEY = 'app_last_seen_update';

export const UpdatesNotification = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [newUpdates, setNewUpdates] = useState<UpdateItem[]>([]);

  useEffect(() => {
    // Verificar última versão vista
    const lastSeenVersion = localStorage.getItem(STORAGE_KEY);
    
    if (!lastSeenVersion) {
      // Primeira vez - mostrar todas as atualizações
      setNewUpdates(updates);
      setIsOpen(true);
    } else {
      // Encontrar atualizações novas
      const lastSeenIndex = updates.findIndex(u => u.id === lastSeenVersion);
      if (lastSeenIndex > 0) {
        // Há novas atualizações
        const unseenUpdates = updates.slice(0, lastSeenIndex);
        setNewUpdates(unseenUpdates);
        setIsOpen(true);
      } else if (lastSeenIndex === -1) {
        // Versão não encontrada, mostrar todas
        setNewUpdates(updates);
        setIsOpen(true);
      }
    }
  }, []);

  const handleClose = () => {
    // Salvar última versão vista
    if (updates.length > 0) {
      localStorage.setItem(STORAGE_KEY, updates[0].id);
    }
    setIsOpen(false);
  };

  if (newUpdates.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        {/* Header com gradiente */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 border-b">
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className="text-xs">
              {newUpdates.length} {newUpdates.length === 1 ? 'novidade' : 'novidades'}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 rounded-full p-3">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Novidades do Sistema</DialogTitle>
              <DialogDescription className="mt-1">
                Confira as últimas atualizações e melhorias
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Lista de atualizações */}
        <ScrollArea className="max-h-[50vh] p-6">
          <div className="space-y-6">
            {newUpdates.map((update, index) => (
              <div 
                key={update.id}
                className={`relative pl-6 ${index !== newUpdates.length - 1 ? 'pb-6 border-l-2 border-border ml-2' : 'ml-2'}`}
              >
                {/* Dot indicator */}
                <div className="absolute -left-[9px] top-0 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                  {getTypeIcon(update.type)}
                </div>

                <div className="bg-muted/30 rounded-lg p-4 border">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeBadge(update.type)}
                      <span className="text-xs text-muted-foreground">v{update.version} • {update.date}</span>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-lg mb-1">{update.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{update.description}</p>
                  
                  {update.details && update.details.length > 0 && (
                    <ul className="space-y-1">
                      {update.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/20">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Versão atual: {updates[0]?.version}
            </p>
            <Button onClick={handleClose}>
              Entendi, vamos lá!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
