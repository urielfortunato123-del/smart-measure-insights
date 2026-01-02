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
    const { fileContent, fileName, projectContext } = await req.json();
    
    if (!fileContent) {
      throw new Error('Conteúdo do arquivo é obrigatório');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const systemPrompt = `Você é um especialista em leitura de projetos de engenharia e construção civil.
Sua tarefa é extrair itens de levantamento de quantitativos a partir do conteúdo de um arquivo de projeto.

Para cada item encontrado, extraia:
- item_code: código do item (se disponível)
- description: descrição detalhada do serviço/material
- unit: unidade de medida (m², m³, m, un, kg, etc.)
- total_quantity: quantidade total do projeto
- location: localização geral (ex: "Bloco A", "Pavimento Térreo")
- floor_level: pavimento ou nível (ex: "Térreo", "1º Pavimento", "Cobertura")
- sector: setor ou ambiente específico (ex: "Sala 01", "Banheiro", "Fachada Norte")

Retorne APENAS um JSON válido com a estrutura:
{
  "items": [
    {
      "item_code": "string ou null",
      "description": "string",
      "unit": "string",
      "total_quantity": number,
      "location": "string ou null",
      "floor_level": "string ou null",
      "sector": "string ou null"
    }
  ],
  "summary": {
    "total_items": number,
    "categories": ["lista de categorias identificadas"]
  }
}`;

    const userPrompt = `Analise o seguinte conteúdo do arquivo "${fileName}" e extraia todos os itens de levantamento de quantitativos:

${projectContext ? `Contexto do projeto: ${projectContext}\n\n` : ''}

Conteúdo do arquivo:
${fileContent}

Extraia todos os itens com suas quantidades, unidades e localizações. Se não conseguir identificar algum campo, use null.`;

    console.log('Chamando Lovable AI para extrair itens...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API Lovable AI:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Resposta vazia da IA');
    }

    // Parse JSON response
    let result;
    try {
      // Remove markdown code blocks if present
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', content);
      throw new Error('Formato de resposta inválido da IA');
    }

    console.log(`Extraídos ${result.items?.length || 0} itens do arquivo`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função extract-survey:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
