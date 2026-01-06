import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Extract data from context
    const measurements = context?.measurements || [];
    const mindMap = context?.mindMap || null;
    const survey = context?.survey || { name: '', items: [] };
    const uploadedFile = context?.uploadedFile || null;

    let systemPrompt = `Você é um assistente especializado em engenharia civil e análise de medições de obras.
Você TEM ACESSO COMPLETO a todos os dados do programa, incluindo:
- Dados de medição carregados pelo usuário
- Mapa mental ativo (metodologia, TPU, cálculos)
- Levantamento de quantitativos

IMPORTANTE: Você PODE e DEVE analisar os dados já carregados no sistema. NÃO peça para o usuário enviar arquivos novamente se os dados já estão disponíveis no contexto.

Seu papel é:
- Analisar dados de medição de obras
- Identificar erros de cálculo (quando quantidade × valor unitário ≠ valor total)
- Detectar outliers e valores suspeitos
- Responder perguntas sobre os dados do mapa mental
- Analisar o levantamento de quantitativos
- Sugerir correções e melhorias
- Quando não souber a resposta, buscar informações técnicas de engenharia

Sempre responda em português brasileiro de forma clara e objetiva.
Use emojis para destacar pontos importantes.
Formate números como moeda brasileira (R$).`;

    // Build full context description
    let contextDescription = '\n\n=== CONTEXTO DOS DADOS DO PROGRAMA ===\n';

    // Measurements context
    if (measurements && measurements.length > 0) {
      const totalValue = measurements.reduce((sum: number, item: any) => sum + (item.valorTotal || 0), 0);
      const totalItems = measurements.length;
      const disciplines = [...new Set(measurements.map((item: any) => item.disciplina).filter(Boolean))];
      const locations = [...new Set(measurements.map((item: any) => item.local).filter(Boolean))];
      
      contextDescription += `\n📊 MEDIÇÕES CARREGADAS (${totalItems} itens):\n`;
      contextDescription += `- Valor total: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      contextDescription += `- Disciplinas: ${disciplines.slice(0, 5).join(', ') || 'Não informado'}\n`;
      contextDescription += `- Locais: ${locations.slice(0, 5).join(', ') || 'Não informado'}\n`;
      
      // Include sample items for analysis
      contextDescription += `\nAmostra dos itens (primeiros 30):\n${JSON.stringify(measurements.slice(0, 30), null, 2)}\n`;
    } else {
      contextDescription += `\n📊 MEDIÇÕES: Nenhuma medição carregada ainda.\n`;
    }

    // Mind Map context
    if (mindMap && mindMap.nodes && mindMap.nodes.length > 0) {
      contextDescription += `\n🧠 MAPA MENTAL ATIVO:\n`;
      contextDescription += `- Tema: ${mindMap.topic}\n`;
      contextDescription += `- Quantidade de nós: ${mindMap.nodes.length}\n`;
      
      // Group nodes by type
      const nodesByType = mindMap.nodes.reduce((acc: any, node: any) => {
        const type = node.type || 'custom';
        if (!acc[type]) acc[type] = [];
        acc[type].push(node);
        return acc;
      }, {});
      
      if (nodesByType.methodology) {
        contextDescription += `\nMetodologia:\n`;
        nodesByType.methodology.forEach((n: any) => {
          contextDescription += `- ${n.title}: ${n.content}\n`;
        });
      }
      if (nodesByType.tpu) {
        contextDescription += `\nCódigos TPU:\n`;
        nodesByType.tpu.forEach((n: any) => {
          contextDescription += `- ${n.title}: ${n.content}\n`;
        });
      }
      if (nodesByType.calculation) {
        contextDescription += `\nFórmulas de Cálculo:\n`;
        nodesByType.calculation.forEach((n: any) => {
          contextDescription += `- ${n.title}: ${n.content}\n`;
        });
      }
      if (nodesByType.attention) {
        contextDescription += `\nPontos de Atenção:\n`;
        nodesByType.attention.forEach((n: any) => {
          contextDescription += `- ${n.title}: ${n.content}\n`;
        });
      }
    } else {
      contextDescription += `\n🧠 MAPA MENTAL: Nenhum mapa mental ativo.\n`;
    }

    // Survey/Quantitative context
    if (survey && survey.items && survey.items.length > 0) {
      const totalValue = survey.items.reduce((sum: number, item: any) => sum + (item.total_value || 0), 0);
      const selectedItems = survey.items.filter((item: any) => item.is_selected);
      
      contextDescription += `\n📋 LEVANTAMENTO DE QUANTITATIVOS${survey.name ? ` - ${survey.name}` : ''}:\n`;
      contextDescription += `- Total de itens: ${survey.items.length}\n`;
      contextDescription += `- Itens selecionados: ${selectedItems.length}\n`;
      contextDescription += `- Valor total: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      
      // Include items
      contextDescription += `\nItens do levantamento:\n${JSON.stringify(survey.items.slice(0, 50), null, 2)}\n`;
    } else {
      contextDescription += `\n📋 LEVANTAMENTO: Nenhum item no levantamento ainda.\n`;
    }

    if (uploadedFile) {
      contextDescription += `\n📁 Arquivo carregado: ${uploadedFile}\n`;
    }

    contextDescription += '\n=== FIM DO CONTEXTO ===\n';

    systemPrompt += contextDescription;

    // Error analysis if requested
    if (action === 'analyze_errors' && measurements && measurements.length > 0) {
      const errors = [];
      for (const item of measurements) {
        const calculatedValue = (item.quantidade || 0) * (item.valorUnitario || 0);
        const difference = Math.abs(calculatedValue - (item.valorTotal || 0));
        const percentDiff = item.valorTotal ? (difference / item.valorTotal) * 100 : 0;
        
        if (percentDiff > 0.01) {
          errors.push({
            item: item.descricao,
            qtd: item.quantidade,
            pu: item.valorUnitario,
            valorInformado: item.valorTotal,
            valorCalculado: calculatedValue,
            diferenca: difference,
            percentual: percentDiff
          });
        }
      }

      if (errors.length > 0) {
        systemPrompt += `\n\n⚠️ ERROS DE CÁLCULO DETECTADOS (${errors.length}):\n${JSON.stringify(errors, null, 2)}`;
      } else {
        systemPrompt += `\n\n✅ Nenhum erro de cálculo detectado nos dados.`;
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos para continuar." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao processar com IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in analyze-measurement:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
