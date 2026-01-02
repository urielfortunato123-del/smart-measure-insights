import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, Calendar, Image, Loader2, LogOut, User, GitCompareArrows, Sparkles, BookOpen, Brain, Clock, Lock, Gift } from 'lucide-react';
import { UserGuide } from '@/components/guide/UserGuide';
import { AdminButton } from '@/components/admin/AdminButton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { toPng } from 'html-to-image';
import { LayoutControls } from './LayoutControls';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DemoTimerProps {
  formattedTime?: string;
  timeRemaining?: number;
  usesRemaining?: number;
  maxWeeklyUses?: number;
  isDemoMode?: boolean;
}

interface DashboardHeaderProps {
  lastUpdate: Date;
  onRefresh: () => void;
  demoProps?: DemoTimerProps;
}

export const DashboardHeader = ({ lastUpdate, onRefresh, demoProps }: DashboardHeaderProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExportDashboard = useCallback(async () => {
    setIsExporting(true);
    try {
      const dashboardElement = document.querySelector('main');
      if (!dashboardElement) {
        throw new Error('Dashboard não encontrado');
      }

      const dataUrl = await toPng(dashboardElement as HTMLElement, {
        backgroundColor: '#0f0f0f',
        quality: 1,
        pixelRatio: 2,
        filter: (node) => {
          if (node.classList?.contains('scrollbar')) return false;
          return true;
        }
      });

      const link = document.createElement('a');
      link.download = `dashboard_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: 'Dashboard exportado!',
        description: 'Imagem salva com sucesso.'
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar a imagem.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  }, [toast]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
    toast({
      title: 'Até logo!',
      description: 'Você saiu do sistema.'
    });
  };

  return (
    <header className="min-h-14 border-b border-white/15 bg-white/10 backdrop-blur-xl flex items-center justify-between px-4 py-2 shrink-0 gap-2 flex-wrap lg:flex-nowrap">
      <div className="flex items-center gap-2 shrink-0">
        <div className="shrink-0">
          <h2 className="text-base font-semibold text-foreground whitespace-nowrap drop-shadow-sm">Executivo</h2>
          <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(lastUpdate)}</span>
          </div>
        </div>
        <Badge variant="outline" className="border-white/30 bg-white/10 text-primary text-xs shrink-0 hidden sm:inline-flex backdrop-blur-sm">
          Medição
        </Badge>
        
        {/* Demo Mode Timer - inline in header */}
        {demoProps?.isDemoMode && (
          <div className="flex items-center gap-2 ml-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono font-medium text-xs text-primary">
                {demoProps.formattedTime}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary bg-transparent">
                <Lock className="h-2.5 w-2.5 mr-0.5" />
                DEGUSTAÇÃO
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Gift className="h-3 w-3" />
              <span>{demoProps.usesRemaining}/{demoProps.maxWeeklyUses}</span>
            </div>
          </div>
        )}
      </div>
      
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1 flex-wrap justify-end">
          <AdminButton />
          
          <LayoutControls />
          
          <div className="h-6 w-px bg-border mx-1 hidden lg:block" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setGuideOpen(true)}>
                <BookOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Manual do Usuário</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => navigate('/analise')}>
                <Sparkles className="h-4 w-4" />
                <span className="hidden xl:inline ml-1">Análise IA</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Análise Inteligente de Planilhas</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => navigate('/comparar')}>
                <GitCompareArrows className="h-4 w-4" />
                <span className="hidden xl:inline ml-1">Comparar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Comparar Arquivos</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => navigate('/mapa-mental')}>
                <Brain className="h-4 w-4" />
                <span className="hidden xl:inline ml-1">Mapa Mental</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Gerar Mapa Mental com IA</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Atualizar Dados</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="h-8 w-8"
                onClick={handleExportDashboard}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Image className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar Dashboard como Imagem</TooltipContent>
          </Tooltip>
          
          {user ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-2">
                      <User className="h-4 w-4" />
                      <span className="hidden lg:inline ml-1 max-w-[80px] truncate">{user.email?.split('@')[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-xs text-muted-foreground">
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent>Minha Conta</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => navigate('/auth')}>
                  <User className="h-4 w-4" />
                  <span className="hidden lg:inline ml-1">Entrar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Entrar na Conta</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>

      {/* User Guide Modal */}
      <UserGuide open={guideOpen} onOpenChange={setGuideOpen} />
    </header>
  );
};
