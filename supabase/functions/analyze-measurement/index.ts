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
    const { messages, data, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = `Você é um assistente especializado em engenharia civil e análise de medições de obras.
Seu papel é:
- Analisar dados de medição de obras
- Identificar erros de cálculo (quando quantidade × valor unitário ≠ valor total)
- Detectar outliers e valores suspeitos
- Sugerir correções
- Responder perguntas sobre os dados

Sempre responda em português brasileiro de forma clara e objetiva.
Use emojis para destacar pontos importantes.
Formate números como moeda brasileira (R$).`;

    // If action is 'analyze_errors', prepare specific analysis
    if (action === 'analyze_errors' && data) {
      const errors = [];
      for (const item of data) {
        const calculatedValue = item.quantidade * item.valorUnitario;
        const difference = Math.abs(calculatedValue - item.valorTotal);
        const percentDiff = (difference / item.valorTotal) * 100;
        
        if (percentDiff > 0.01) { // More than 0.01% difference
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

      const analysisContext = `
Dados da medição atual (${data.length} itens):
${JSON.stringify(data.slice(0, 20), null, 2)}

Erros de cálculo encontrados: ${errors.length}
${errors.length > 0 ? JSON.stringify(errors, null, 2) : 'Nenhum erro encontrado.'}
`;

      systemPrompt += `\n\nContexto dos dados:\n${analysisContext}`;
    } else if (data) {
      // General context
      const summary = {
        totalItens: data.length,
        valorTotal: data.reduce((sum: number, item: any) => sum + (item.valorTotal || 0), 0),
        disciplinas: [...new Set(data.map((item: any) => item.disciplina))],
        locais: [...new Set(data.map((item: any) => item.local))]
      };
      systemPrompt += `\n\nResumo dos dados carregados:\n${JSON.stringify(summary, null, 2)}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
