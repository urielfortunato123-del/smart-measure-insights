import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, Calendar, Image, Loader2, LogOut, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { toPng } from 'html-to-image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardHeaderProps {
  lastUpdate: Date;
  onRefresh: () => void;
}

export const DashboardHeader = ({ lastUpdate, onRefresh }: DashboardHeaderProps) => {
  const [isExporting, setIsExporting] = useState(false);
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
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Painel Executivo</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Atualizado em {formatDate(lastUpdate)}</span>
          </div>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary">
          Boletim de Medição
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExportDashboard}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Image className="h-4 w-4 mr-2" />
          )}
          Exportar Dashboard
        </Button>
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                {user.email?.split('@')[0]}
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
        ) : (
          <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
            <User className="h-4 w-4 mr-2" />
            Entrar
          </Button>
        )}
      </div>
    </header>
  );
};
