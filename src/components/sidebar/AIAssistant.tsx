import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  dataContext: string;
}

export const AIAssistant = ({ dataContext }: AIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou seu assistente de engenharia. Posso ajudar com análises dos dados de medição. Experimente perguntar: "Qual o saldo do Trecho A?" ou "Resumo por disciplina".'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateResponse = (question: string): string => {
    const q = question.toLowerCase();
    
    if (q.includes('saldo') || q.includes('balanço') || q.includes('restante')) {
      return `📊 **Análise de Saldo**\n\nCom base nos dados atuais:\n\n• **Terraplanagem**: R$ 1.337.734,25 medido\n• **Pavimentação**: R$ 178.450,00 medido\n• **Drenagem**: R$ 70.450,00 medido\n\nO Trecho A concentra a maior parte das medições. Deseja um detalhamento por local?`;
    }
    
    if (q.includes('resumo') || q.includes('geral') || q.includes('overview')) {
      return `📈 **Resumo Executivo**\n\n• **Total Medido**: R$ 1.866.634,25\n• **12 itens** lançados\n• **1 outlier** detectado (Escavação em rocha)\n• **4 disciplinas** ativas\n\nA disciplina com maior valor é Terraplanagem (72% do total).`;
    }
    
    if (q.includes('outlier') || q.includes('alerta') || q.includes('problema')) {
      return `⚠️ **Análise de Outliers**\n\nDetectei 1 potencial anomalia:\n\n• **Escavação em rocha** (21/01)\n  - Valor: R$ 1.275.000,00\n  - 3.2x acima da média de Terraplanagem\n\nRecomendo verificar se a quantidade de 15.000m³ está correta.`;
    }
    
    if (q.includes('disciplina') || q.includes('atividade')) {
      return `🏗️ **Composição por Disciplina**\n\n1. **Terraplanagem**: R$ 1.337.734 (72%)\n2. **Sinalização**: R$ 173.750 (9%)\n3. **Pavimentação**: R$ 178.450 (10%)\n4. **Drenagem**: R$ 70.450 (4%)\n5. **Obras de Arte**: R$ 106.250 (6%)`;
    }

    return `Entendi sua pergunta sobre "${question}".\n\nCom base nos dados carregados, posso fornecer análises sobre:\n• Saldos e balanços por trecho\n• Composição por disciplina\n• Detecção de outliers\n• Evolução temporal\n\nPode reformular sua pergunta?`;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(input)
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="border-border flex flex-col h-[400px]">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Assistente IA
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 min-h-0 p-3 pt-0">
        <ScrollArea className="flex-1 pr-3" ref={scrollRef}>
          <div className="space-y-3">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div 
                  className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary/70'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
                {message.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-secondary/70 rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex gap-2 mt-3 shrink-0">
          <Input
            placeholder="Pergunte algo..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bg-secondary/50"
          />
          <Button 
            size="icon" 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
