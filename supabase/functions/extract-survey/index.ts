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
    const { fileBase64, fileType, fileName, projectContext, fileContent } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const isPDF = fileType === 'pdf';
    let textContent = fileContent || '';

    const systemPrompt = `Você é um especialista em análise de projetos de engenharia civil, arquitetura e instalações.

Sua tarefa é analisar o conteúdo de um arquivo de projeto e EXTRAIR TODOS os itens quantificáveis para orçamento.

TIPOS DE PROJETO QUE VOCÊ ANALISA:
1. **Instalações (PCI, hidráulica, elétrica, gás)**: Tubulações, conexões, equipamentos, acessórios
2. **Revestimentos (cerâmica, porcelanato, granito)**: Áreas de piso, parede, rodapé com tipos de material
3. **Arquitetura**: Áreas, esquadrias, acabamentos, pinturas
4. **Estrutura**: Volumes de concreto, armaduras, formas

REGRAS DE EXTRAÇÃO:
1. Extraia CADA item com sua descrição COMPLETA (incluindo dimensões, modelo, especificações)
2. Identifique a unidade correta: m², m, m³, UN, kg, l, pç, vb
3. Para revestimentos cerâmicos:
   - Separe por ambiente (sala, cozinha, banheiro, etc)
   - Identifique tipo (piso ou parede)
   - Inclua dimensões do revestimento (ex: 60x60, 30x60)
   - Extraia áreas em m²
4. Para tabelas de quantitativos, extraia linha por linha
5. Identifique preços unitários se disponíveis
6. Identifique localizações (pavimento, setor, ambiente)
7. Leia TODAS as tabelas, legendas e textos do documento

Retorne APENAS JSON válido:
{
  "items": [
    {
      "item_code": "string ou null",
      "description": "descrição completa com especificações",
      "unit": "UN/m/m²/m³/kg/l/pç/vb",
      "total_quantity": number,
      "unit_price": number ou 0,
      "location": "ambiente ou local",
      "floor_level": "pavimento",
      "sector": "setor ou tipo"
    }
  ],
  "project_info": {
    "type": "tipo do projeto",
    "title": "título",
    "engineer": "engenheiro se disponível",
    "crea": "CREA se disponível"
  }
}`;

    const userPrompt = `Analise este projeto e extraia TODOS os itens quantificáveis para orçamento.

Nome do arquivo: "${fileName}"
Contexto: ${projectContext || 'Projeto de engenharia'}

${!isPDF ? `CONTEÚDO DO ARQUIVO:
---
${textContent.substring(0, 100000)}
---` : 'O arquivo PDF está anexado. Analise todas as tabelas, legendas e textos.'}

INSTRUÇÕES:
1. Leia TODO o conteúdo e identifique tabelas, legendas e especificações
2. Para cada item encontrado, extraia quantidade, unidade e descrição completa
3. Se houver áreas de revestimento, separe por ambiente e tipo
4. Mantenha todas as especificações técnicas (dimensões, modelo, material)
5. Se encontrar preços, inclua-os
6. Agrupe itens por localização quando possível

Retorne o JSON completo com TODOS os itens.`;

    console.log('Processing file:', fileName, 'Type:', fileType, 'Is PDF:', isPDF);

    // Build messages - for PDF, use vision capability with base64
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    if (isPDF && fileBase64) {
      // Use multimodal capability - send PDF as document
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: userPrompt
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:application/pdf;base64,${fileBase64}`
            }
          }
        ]
      });
    } else {
      messages.push({ role: 'user', content: userPrompt });
    }

    console.log('Sending to Lovable AI for analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Aguarde alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Erro na API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('AI response received, parsing...');

    let result;
    try {
      const jsonStr = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', content.substring(0, 500));
      result = { items: [], project_info: { type: 'Não identificado' } };
    }

    if (!result.items) {
      result.items = [];
    }

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

    console.log(`Extraídos ${result.items.length} itens do arquivo`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-survey:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
