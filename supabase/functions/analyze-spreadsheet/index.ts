import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CellError {
  row: number;
  col: number;
  type: 'calculation' | 'inconsistent' | 'duplicate' | 'missing';
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface AnalysisResult {
  errors: CellError[];
  summary: {
    totalRows: number;
    totalErrors: number;
    calculationErrors: number;
    inconsistentValues: number;
    duplicates: number;
    missingData: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data, headers } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Analyzing spreadsheet with ${data.length} rows and ${headers.length} columns`);

    // First pass: local analysis for quick checks
    const errors: CellError[] = [];
    const seenValues = new Map<string, number[]>();
    
    // Find numeric columns (likely for calculations)
    const numericCols: number[] = [];
    const valueColPatterns = ['valor', 'total', 'preco', 'preço', 'custo', 'qtd', 'quantidade'];
    
    headers.forEach((header: string | null | undefined, colIndex: number) => {
      if (!header) return;
      const headerLower = String(header).toLowerCase();
      if (valueColPatterns.some(p => headerLower.includes(p))) {
        numericCols.push(colIndex);
      }
    });

    // Check for missing data and build duplicate map
    data.forEach((row: any, rowIndex: number) => {
      if (!row || !Array.isArray(row)) return;
      
      headers.forEach((header: string | null | undefined, colIndex: number) => {
        const value = row[colIndex];
        const headerName = header ? String(header) : `Coluna ${colIndex + 1}`;
        
        // Missing data check - only for first few important columns
        if (colIndex < 5 && (value === null || value === undefined || value === '')) {
          errors.push({
            row: rowIndex,
            col: colIndex,
            type: 'missing',
            message: `Campo "${headerName}" está vazio`,
            severity: 'info'
          });
        }
        
        // Build duplicate detection map for key columns
        if (colIndex === 0 && value != null && value !== '') {
          const key = String(value).toLowerCase().trim();
          if (key) {
            if (!seenValues.has(key)) {
              seenValues.set(key, []);
            }
            seenValues.get(key)!.push(rowIndex);
          }
        }
      });
    });

    // Check for duplicates
    seenValues.forEach((rows, key) => {
      if (rows.length > 1) {
        rows.forEach(rowIndex => {
          errors.push({
            row: rowIndex,
            col: 0,
            type: 'duplicate',
            message: `Valor "${key}" aparece ${rows.length} vezes (linhas: ${rows.map(r => r + 1).join(', ')})`,
            severity: 'warning'
          });
        });
      }
    });

    // Use AI for deeper analysis
    const prompt = `Analise esta planilha de medição de obra e identifique ERROS específicos.

CABEÇALHOS: ${JSON.stringify(headers)}

DADOS (primeiras 50 linhas):
${JSON.stringify(data.slice(0, 50), null, 2)}

Procure por:
1. ERROS DE CÁLCULO: Onde quantidade × valor unitário ≠ valor total (diferença > 1%)
2. VALORES INCONSISTENTES: Valores muito altos ou baixos comparados à média (outliers > 3 desvios padrão)
3. PADRÕES SUSPEITOS: Valores que parecem digitados errado

Para cada erro encontrado, retorne EXATAMENTE neste formato JSON:
{
  "aiErrors": [
    {
      "row": 0,
      "col": 2,
      "type": "calculation",
      "message": "Valor total R$ 1.500,00 deveria ser R$ 1.000,00 (10 × R$ 100,00)"
    }
  ]
}

IMPORTANTE:
- row e col são índices baseados em 0
- type deve ser: "calculation", "inconsistent" ou "duplicate"
- Retorne APENAS o JSON, sem texto adicional
- Se não encontrar erros, retorne {"aiErrors": []}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { 
            role: "system", 
            content: "Você é um especialista em análise de planilhas de medição de obras. Responda APENAS com JSON válido." 
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      // Continue with local analysis only
    } else {
      const aiResult = await response.json();
      const aiContent = aiResult.choices?.[0]?.message?.content || '';
      
      console.log("AI response:", aiContent);
      
      try {
        // Extract JSON from response
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.aiErrors && Array.isArray(parsed.aiErrors)) {
            parsed.aiErrors.forEach((err: any) => {
              errors.push({
                row: err.row,
                col: err.col,
                type: err.type || 'inconsistent',
                message: err.message,
                severity: err.type === 'calculation' ? 'error' : 'warning'
              });
            });
          }
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
      }
    }

    // Calculate summary
    const summary = {
      totalRows: data.length,
      totalErrors: errors.length,
      calculationErrors: errors.filter(e => e.type === 'calculation').length,
      inconsistentValues: errors.filter(e => e.type === 'inconsistent').length,
      duplicates: errors.filter(e => e.type === 'duplicate').length,
      missingData: errors.filter(e => e.type === 'missing').length,
    };

    console.log("Analysis complete:", summary);

    const result: AnalysisResult = { errors, summary };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-spreadsheet:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido",
      errors: [],
      summary: {
        totalRows: 0,
        totalErrors: 0,
        calculationErrors: 0,
        inconsistentValues: 0,
        duplicates: 0,
        missingData: 0,
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
