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

    const systemPrompt = `Você é um especialista em análise de projetos de engenharia civil, arquitetura e instalações (hidráulica, elétrica, incêndio, etc).

Sua tarefa é analisar o conteúdo de um arquivo de projeto e EXTRAIR TODOS os itens que podem ser quantificados para orçamento/medição.

Para projetos de instalações (PCI, hidráulica, elétrica), extraia:
- Tubulações com seus diâmetros e comprimentos
- Conexões (joelhos, tês, reduções, uniões)
- Equipamentos (bombas, quadros elétricos, válvulas, registros)
- Acessórios (manômetros, pressostatos, hidrantes, sprinklers)
- Suportes e fixações

Para projetos de arquitetura/estrutura, extraia:
- Áreas de piso, parede, forro
- Comprimentos de elementos lineares
- Quantidades de peças/unidades
- Volumes de concreto, alvenaria

REGRAS IMPORTANTES:
1. Sempre indique a unidade correta (m, m², m³, un, kg, etc)
2. Se aparecer "Ø" ou "DN", é diâmetro de tubulação - extraia como item
3. Extraia TODOS os itens da legenda do projeto
4. Se houver tabela de materiais, extraia todos os itens
5. Para cada equipamento listado, crie um item separado
6. Se encontrar especificações técnicas (modelo, potência, capacidade), inclua na descrição

Retorne APENAS um JSON válido:
{
  "items": [
    {
      "item_code": "string ou null",
      "description": "descrição completa incluindo especificações",
      "unit": "UN/m/m²/m³/kg/etc",
      "total_quantity": number,
      "unit_price": 0,
      "location": "string ou null",
      "floor_level": "string ou null",
      "sector": "string ou null"
    }
  ],
  "project_info": {
    "type": "tipo do projeto (PCI, hidráulica, elétrica, arquitetura, etc)",
    "title": "título identificado",
    "engineer": "nome do engenheiro se disponível",
    "crea": "número do CREA se disponível"
  }
}`;

    const userPrompt = `Analise este projeto de engenharia e extraia TODOS os itens quantificáveis.

Nome do arquivo: "${fileName}"
Contexto: ${projectContext || 'Projeto de engenharia'}

CONTEÚDO DO ARQUIVO:
---
${fileContent}
---

INSTRUÇÕES:
1. Identifique o tipo de projeto (instalações, arquitetura, estrutura, etc)
2. Extraia CADA item que aparece na legenda, tabela de materiais ou especificações
3. Para tubulações, separe por diâmetro
4. Para equipamentos, inclua todas as especificações técnicas
5. Se não conseguir determinar quantidade, use 1 e marque para revisão
6. Extraia também informações do responsável técnico se disponíveis

Retorne o JSON com TODOS os itens encontrados.`;

    console.log('Analisando projeto com Lovable AI...');
    console.log('Tamanho do conteúdo:', fileContent.length, 'caracteres');

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

    console.log('Resposta da IA recebida, processando...');

    // Parse JSON response
    let result;
    try {
      // Remove markdown code blocks if present
      const jsonStr = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', content.substring(0, 500));
      
      // Try to extract items manually if JSON parsing fails
      result = {
        items: [],
        project_info: { type: 'Não identificado' }
      };
    }

    // Ensure items array exists
    if (!result.items) {
      result.items = [];
    }

    // Clean up items
    result.items = result.items.map((item: any, index: number) => ({
      item_code: item.item_code || `ITEM-${String(index + 1).padStart(3, '0')}`,
      description: item.description || 'Item não identificado',
      unit: item.unit || 'UN',
      total_quantity: Number(item.total_quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      location: item.location || null,
      floor_level: item.floor_level || null,
      sector: item.sector || null
    }));

    console.log(`Extraídos ${result.items.length} itens do projeto`);

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
