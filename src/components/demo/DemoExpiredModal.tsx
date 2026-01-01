import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Crown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DemoExpiredModalProps {
  open: boolean;
}

export const DemoExpiredModal = ({ open }: DemoExpiredModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
          <DialogTitle className="text-2xl">Tempo de Degustação Esgotado</DialogTitle>
          <DialogDescription className="text-base">
            Seu período de teste gratuito de 3 minutos terminou. 
            Para continuar usando todas as funcionalidades, assine um de nossos planos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button 
            size="lg" 
            className="w-full gap-2"
            onClick={() => navigate('/precos')}
          >
            <Crown className="h-5 w-5" />
            Ver Planos e Preços
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="w-full gap-2"
            onClick={() => navigate('/auth')}
          >
            <Sparkles className="h-5 w-5" />
            Criar Conta / Entrar
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Ao assinar, você terá acesso completo a todas as funcionalidades do sistema.
        </p>
      </DialogContent>
    </Dialog>
  );
};
