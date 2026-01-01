import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Sparkles, Zap, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

interface PlanProps {
  name: string;
  price: number;
  period: string;
  originalPrice?: number;
  discount?: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
}

const plans: PlanProps[] = [
  {
    name: 'Mensal',
    price: 129.90,
    period: '/mês',
    features: [
      'Acesso completo ao sistema',
      'Análise de medições ilimitadas',
      'Comparação de planilhas',
      'IA para análise inteligente',
      'Mapa mental automático',
      'Suporte por email',
      'Atualizações incluídas'
    ],
    icon: <Zap className="h-6 w-6" />
  },
  {
    name: 'Semestral',
    price: 99.90,
    period: '/mês',
    originalPrice: 129.90,
    discount: '23% OFF',
    features: [
      'Tudo do plano Mensal',
      'Economia de R$ 180 no período',
      'Prioridade no suporte',
      'Relatórios avançados',
      'Exportação em múltiplos formatos',
      'Backup automático na nuvem',
      'Acesso a recursos beta'
    ],
    popular: true,
    icon: <Sparkles className="h-6 w-6" />
  },
  {
    name: 'Anual',
    price: 79.90,
    period: '/mês',
    originalPrice: 129.90,
    discount: '38% OFF',
    features: [
      'Tudo do plano Semestral',
      'Economia de R$ 600 no ano',
      'Suporte prioritário 24/7',
      'Treinamento personalizado',
      'API para integrações',
      'White-label disponível',
      'Consultoria mensal incluída',
      'Acesso antecipado a novidades'
    ],
    icon: <Crown className="h-6 w-6" />
  }
];

const PlanCard = ({ plan, isSelected, onSelect }: { 
  plan: PlanProps; 
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const totalPrice = plan.name === 'Mensal' 
    ? plan.price 
    : plan.name === 'Semestral' 
      ? plan.price * 6 
      : plan.price * 12;

  return (
    <Card className={cn(
      "relative flex flex-col transition-all duration-300 hover:shadow-xl",
      plan.popular && "border-primary shadow-lg scale-105",
      isSelected && "ring-2 ring-primary"
    )}>
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1">
          Mais Popular
        </Badge>
      )}
      
      {plan.discount && (
        <Badge variant="destructive" className="absolute -top-3 right-4">
          {plan.discount}
        </Badge>
      )}

      <CardHeader className="text-center pb-2">
        <div className={cn(
          "mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center",
          plan.popular ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          {plan.icon}
        </div>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>
          {plan.name === 'Mensal' && 'Flexibilidade total'}
          {plan.name === 'Semestral' && 'Melhor custo-benefício'}
          {plan.name === 'Anual' && 'Máxima economia'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="text-center mb-6">
          {plan.originalPrice && (
            <p className="text-sm text-muted-foreground line-through">
              R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
            </p>
          )}
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-sm text-muted-foreground">R$</span>
            <span className="text-5xl font-bold text-foreground">
              {plan.price.toFixed(2).replace('.', ',').split(',')[0]}
            </span>
            <span className="text-2xl font-bold text-foreground">
              ,{plan.price.toFixed(2).split('.')[1]}
            </span>
            <span className="text-muted-foreground">{plan.period}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Total: R$ {totalPrice.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full" 
          variant={plan.popular ? "default" : "outline"}
          size="lg"
          onClick={onSelect}
        >
          {isSelected ? 'Selecionado' : 'Escolher Plano'}
        </Button>
      </CardFooter>
    </Card>
  );
};

const Precos = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
    // Here you would integrate with Stripe or another payment provider
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Button
            variant="ghost"
            className="absolute top-4 left-4"
            onClick={() => navigate('/auth')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <img 
            src={logo} 
            alt="Logo" 
            className="w-20 h-20 mx-auto mb-6 object-contain"
          />
          
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Invista na produtividade da sua equipe de engenharia. 
            Todos os planos incluem acesso completo às funcionalidades do sistema.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              isSelected={selectedPlan === plan.name}
              onSelect={() => handleSelectPlan(plan.name)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            💳 Pagamento seguro via cartão de crédito, PIX ou boleto
          </p>
          <p className="text-sm text-muted-foreground">
            ✅ Garantia de 7 dias - Não gostou? Devolvemos seu dinheiro.
          </p>
          <p className="text-xs text-muted-foreground mt-8">
            Desenvolvido por <span className="text-primary font-medium">Uriel da Fonseca Fortunato</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Precos;
