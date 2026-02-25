import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OCR_PROMPT = `Extraia todo o texto desta imagem/documento e retorne em formato Markdown bem estruturado. 
Se houver tabelas, use a sintaxe de tabela Markdown. 
Se houver listas, use listas Markdown. 
Mantenha a hierarquia de títulos com #, ##, ###.
Preserve números, códigos e valores exatamente como aparecem.
Retorne APENAS o conteúdo extraído em Markdown, sem explicações adicionais.`;

const PDF_MULTI_PAGE_PROMPT = `Extraia todo o texto de TODAS as páginas deste documento PDF e retorne em formato Markdown bem estruturado.
Separe cada página com "---" (horizontal rule) e indique o número da página com "## Página X".
Se houver tabelas, use a sintaxe de tabela Markdown.
Se houver listas, use listas Markdown.
Mantenha a hierarquia de títulos com #, ##, ###.
Preserve números, códigos e valores exatamente como aparecem.
Retorne APENAS o conteúdo extraído em Markdown, sem explicações adicionais.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, fileName, mimeType } = await req.json();

    const MISTRAL_API_KEY = Deno.env.get('MISTRAL_API_KEY');
    if (!MISTRAL_API_KEY) {
      throw new Error('MISTRAL_API_KEY não configurada');
    }

    const isPDF = mimeType === 'application/pdf';
    console.log(`Processing OCR with Mistral for: ${fileName || 'file'} (${isPDF ? 'PDF' : 'image'})`);

    const dataUrl = `data:${mimeType || 'image/png'};base64,${imageBase64}`;
    const prompt = isPDF ? PDF_MULTI_PAGE_PROMPT : OCR_PROMPT;

    // Mistral Pixtral supports PDFs natively via document_url
    const contentParts: any[] = [
      { type: 'text', text: prompt },
    ];

    if (isPDF) {
      contentParts.push({
        type: 'document_url',
        document_url: dataUrl,
      });
    } else {
      contentParts.push({
        type: 'image_url',
        image_url: { url: dataUrl },
      });
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'user',
            content: contentParts,
          }
        ],
        max_tokens: 16384,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mistral API error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Limite de requisições Mistral excedido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ success: false, error: 'Chave API Mistral inválida.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Mistral API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const markdownText = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens || 0;

    // Count pages from markdown separators for PDFs
    const pagesProcessed = isPDF
      ? (markdownText.match(/## Página \d+/g)?.length || 1)
      : 1;

    console.log(`Mistral OCR completed. Tokens: ${tokensUsed}, Pages: ${pagesProcessed}`);

    return new Response(
      JSON.stringify({
        success: true,
        text: markdownText,
        format: 'markdown',
        confidence: 95,
        tokensUsed,
        pagesProcessed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Mistral OCR error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido no OCR Mistral',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
