import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, GitCompareArrows } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ComparisonUploader } from '@/components/comparison/ComparisonUploader';
import { ComparisonResults } from '@/components/comparison/ComparisonResults';
import { ComparisonResult, ComparisonType } from '@/types/comparison';
import { TPUEntry } from '@/types/tpu';
import { MeasurementEntry } from '@/types/measurement';
import { compareTPU, compareMeasurements } from '@/lib/comparisonUtils';
import { useToast } from '@/hooks/use-toast';

const Comparar = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [result, setResult] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleCompare = useCallback((
    base: TPUEntry[] | MeasurementEntry[],
    comparacao: TPUEntry[] | MeasurementEntry[],
    tipo: ComparisonType,
    nomeBase: string,
    nomeComparacao: string
  ) => {
    try {
      let comparisonResult: ComparisonResult;
      
      if (tipo === 'tpu') {
        comparisonResult = compareTPU(
          base as TPUEntry[],
          comparacao as TPUEntry[],
          nomeBase,
          nomeComparacao
        );
      } else {
        comparisonResult = compareMeasurements(
          base as MeasurementEntry[],
          comparacao as MeasurementEntry[],
          nomeBase,
          nomeComparacao
        );
      }
      
      setResult(comparisonResult);
      
      toast({
        title: 'Comparação concluída',
        description: `${comparisonResult.items.length} itens analisados`
      });
    } catch (error) {
      console.error('Error comparing:', error);
      toast({
        title: 'Erro na comparação',
        description: 'Verifique se os arquivos estão no formato correto',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const handleReset = useCallback(() => {
    setResult(null);
  }, []);

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
              <GitCompareArrows className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Comparar Arquivos</h1>
              <p className="text-xs text-muted-foreground">
                Compare TPU ou medições de diferentes períodos
              </p>
            </div>
          </div>
          
          {result && (
            <div className="ml-auto">
              <Button variant="secondary" size="sm" onClick={handleReset}>
                Nova Comparação
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <ScrollArea className="h-[calc(100vh-56px)]">
        <main className="container py-6 space-y-6">
          {!result ? (
            <ComparisonUploader onCompare={handleCompare} />
          ) : (
            <ComparisonResults result={result} onClose={handleReset} />
          )}
        </main>
      </ScrollArea>
    </div>
  );
};

export default Comparar;
