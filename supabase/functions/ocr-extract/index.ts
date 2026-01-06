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
    const { imageBase64, imageUrl, language = 'por', isTable = true } = await req.json();
    
    const OCR_API_KEY = Deno.env.get('OCR_SPACE_API_KEY');
    if (!OCR_API_KEY) {
      throw new Error('OCR_SPACE_API_KEY não configurada');
    }

    console.log('Processing OCR request...', { hasBase64: !!imageBase64, hasUrl: !!imageUrl });

    const formData = new FormData();
    formData.append('apikey', OCR_API_KEY);
    formData.append('language', language);
    formData.append('isTable', isTable.toString());
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Engine 2 is better for tables and special chars

    if (imageBase64) {
      // Send base64 image
      formData.append('base64Image', `data:image/png;base64,${imageBase64}`);
    } else if (imageUrl) {
      // Send URL
      formData.append('url', imageUrl);
    } else {
      throw new Error('Deve fornecer imageBase64 ou imageUrl');
    }

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OCR.space error:', response.status, errorText);
      throw new Error(`Erro OCR.space: ${response.status}`);
    }

    const data = await response.json();
    console.log('OCR response:', JSON.stringify(data).substring(0, 500));

    if (data.IsErroredOnProcessing) {
      throw new Error(data.ErrorMessage?.[0] || 'Erro no processamento OCR');
    }

    // Extract text from all parsed results
    const parsedResults = data.ParsedResults || [];
    const extractedText = parsedResults
      .map((result: any) => result.ParsedText || '')
      .join('\n\n');

    const confidence = parsedResults.length > 0 
      ? parsedResults.reduce((sum: number, r: any) => sum + (r.TextOverlay?.HasOverlay ? 90 : 70), 0) / parsedResults.length
      : 0;

    return new Response(
      JSON.stringify({
        success: true,
        text: extractedText,
        confidence,
        pagesProcessed: parsedResults.length,
        processingTime: data.ProcessingTimeInMilliseconds || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ocr-extract:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        text: ''
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
