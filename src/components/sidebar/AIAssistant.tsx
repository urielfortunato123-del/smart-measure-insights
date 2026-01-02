import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Sparkles, Loader2, Brain, ClipboardList, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppData } from '@/contexts/AppDataContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-measurement`;

export const AIAssistant = () => {
  const { getFullContext, measurementData, currentMindMap, surveyItems } = useAppData();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Olá! Sou seu assistente inteligente.\n\n📊 Tenho acesso a:\n• Dados de medição carregados\n• Mapa mental ativo\n• Levantamento de quantitativos\n\nPergunte qualquer coisa sobre os dados do programa!'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Check what data is available
  const hasData = measurementData.length > 0 || currentMindMap !== null || surveyItems.length > 0;
  const dataContext = {
    hasMeasurements: measurementData.length > 0,
    hasMindMap: currentMindMap !== null,
    hasSurvey: surveyItems.length > 0,
    measurementCount: measurementData.length,
    surveyCount: surveyItems.length,
    mindMapTopic: currentMindMap?.topic || null
  };

  const streamChat = async (userMessage: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const fullContext = getFullContext();
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...messages.filter(m => m.id !== '1'), userMsg].map(m => ({
            role: m.role,
            content: m.content
          })),
          context: {
            measurements: fullContext.measurements,
            mindMap: fullContext.mindMap,
            survey: fullContext.survey,
            uploadedFile: fullContext.uploadedFile
          },
          action: userMessage.toLowerCase().includes('erro') ? 'analyze_errors' : 'chat'
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      // Create assistant message placeholder
      const assistantId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => 
                prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m)
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('AI Error:', error);
      toast({
        title: 'Erro na IA',
        description: error instanceof Error ? error.message : 'Erro ao processar',
        variant: 'destructive'
      });
      
      // Add error message
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Desculpe, ocorreu um erro. ${error instanceof Error ? error.message : 'Tente novamente.'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput('');
    streamChat(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: 'Verificar erros', action: 'Verifique erros de cálculo nos dados' },
    { label: 'Resumo geral', action: 'Faça um resumo geral dos dados carregados' },
    { label: 'Analisar quantitativos', action: 'Analise o levantamento de quantitativos' }
  ];

  const handleCopy = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      toast({
        title: 'Copiado!',
        description: 'Texto copiado para a área de transferência',
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o texto',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="border-border flex flex-col h-[300px] max-w-[180px]">
      <CardHeader className="pb-1 px-2 py-2 shrink-0">
        <CardTitle className="text-xs font-medium flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="truncate">Assistente IA</span>
          <span className="text-[10px] text-muted-foreground font-normal ml-auto">Gemini</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 min-h-0 p-2 pt-0">
        {/* Context indicators */}
        <div className="flex gap-1 mb-1 flex-wrap">
          {dataContext.hasMeasurements && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] rounded-full">
              <ClipboardList className="h-2 w-2" />
              {dataContext.measurementCount}
            </span>
          )}
          {dataContext.hasMindMap && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] rounded-full">
              <Brain className="h-2 w-2" />
              Mapa
            </span>
          )}
          {dataContext.hasSurvey && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] rounded-full">
              <ClipboardList className="h-2 w-2" />
              {dataContext.surveyCount} itens
            </span>
          )}
        </div>
        
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
                  className={`rounded-lg px-2 py-1.5 max-w-[95%] text-[10px] ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary/70'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.role === 'assistant' && message.content && message.id !== '1' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 mt-1 text-[9px] text-muted-foreground hover:text-foreground"
                      onClick={() => handleCopy(message.id, message.content)}
                    >
                      {copiedId === message.id ? (
                        <><Check className="h-2.5 w-2.5 mr-0.5" /> Copiado</>
                      ) : (
                        <><Copy className="h-2.5 w-2.5 mr-0.5" /> Copiar</>
                      )}
                    </Button>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.content === '' && (
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

        {/* Quick actions */}
        {hasData && messages.length <= 2 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {quickActions.map((qa) => (
              <Button
                key={qa.label}
                variant="outline"
                size="sm"
                className="text-xs h-7 text-card-foreground bg-card/80 border-border hover:bg-card"
                onClick={() => streamChat(qa.action)}
                disabled={isLoading}
              >
                {qa.label}
              </Button>
            ))}
          </div>
        )}

        <div className="flex gap-1 mt-2 shrink-0">
          <Input
            placeholder="Pergunte algo..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bg-secondary/50 text-[10px] h-7"
            disabled={isLoading}
          />
          <Button 
            size="icon" 
            className="h-7 w-7"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
