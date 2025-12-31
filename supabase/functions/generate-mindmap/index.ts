import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, context } = await req.json();
    
    console.log('Generating mind map for topic:', topic);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Você é um especialista em engenharia civil, especialmente em medições de obras e serviços de construção. 
    
Sua tarefa é gerar um mapa mental estruturado para ajudar engenheiros a realizar medições corretamente.

Para cada serviço/tópico solicitado, você deve retornar um JSON com nós organizados em 4 categorias:

1. **methodology** (Metodologia): Como medir corretamente, passo a passo
2. **tpu** (TPU/SINAPI): Códigos de referência de tabelas de preços (SINAPI, SICRO, etc.)
3. **attention** (Pontos de Atenção): Erros comuns, cuidados especiais, o que verificar
4. **calculation** (Memória de Cálculo): Fórmulas, unidades, critérios de aferição

Retorne APENAS o JSON válido, sem markdown ou texto adicional. Estrutura:
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "methodology|tpu|attention|calculation",
      "title": "Título curto",
      "description": "Descrição detalhada",
      "children": [
        {
          "id": "child-id",
          "type": "custom",
          "title": "Sub-item",
          "description": "Detalhes"
        }
      ]
    }
  ],
  "suggestions": ["sugestão 1", "sugestão 2"]
}`;

    const userPrompt = `Gere um mapa mental completo para medição de: "${topic}"
${context ? `\nContexto adicional: ${context}` : ''}

Inclua:
- Pelo menos 3 itens de metodologia com passos práticos
- 2-4 códigos de referência TPU/SINAPI relevantes
- 3-5 pontos de atenção importantes
- Fórmulas e critérios de cálculo aplicáveis`;

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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao seu workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    console.log('AI response received, parsing...');
    
    // Parse the JSON response
    let parsedData;
    try {
      // Clean up the response if it contains markdown code blocks
      let cleanContent = content;
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (content.includes('```')) {
        cleanContent = content.replace(/```\n?/g, '');
      }
      parsedData = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw content:', content);
      
      // Return a default structure if parsing fails
      parsedData = {
        nodes: [
          {
            id: 'methodology-1',
            type: 'methodology',
            title: 'Metodologia de Medição',
            description: `Procedimentos para medir ${topic}`,
            children: []
          },
          {
            id: 'attention-1',
            type: 'attention',
            title: 'Pontos de Atenção',
            description: 'Verificações importantes durante a medição',
            children: []
          }
        ],
        suggestions: ['Adicione mais detalhes ao tópico']
      };
    }

    console.log('Mind map generated successfully');

    return new Response(
      JSON.stringify(parsedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating mind map:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar mapa mental';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
