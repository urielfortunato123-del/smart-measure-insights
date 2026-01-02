import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SurveyItem {
  id: string;
  description: string;
  unit?: string;
  total_quantity?: number;
  item_code?: string;
}

interface TPUItem {
  codigo: string;
  descricao: string;
  unidade: string;
  preco: number;
}

interface PriceResult {
  item_id: string;
  description: string;
  unit_price: number;
  source: string;
  confidence: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { surveyItems, tpuData, userId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: PriceResult[] = [];

    // 1. Buscar preços no banco de dados interno (price_history)
    const { data: priceHistory } = await supabase
      .from("price_history")
      .select("*")
      .eq("user_id", userId);

    // 2. Processar cada item do levantamento
    for (const item of surveyItems as SurveyItem[]) {
      let priceFound = false;
      let unitPrice = 0;
      let source = "";
      let confidence = 0;

      // Primeiro: buscar na tabela TPU carregada
      if (tpuData && tpuData.length > 0) {
        const tpuMatch = (tpuData as TPUItem[]).find(
          (tpu) =>
            tpu.codigo === item.item_code ||
            tpu.descricao.toLowerCase().includes(item.description.toLowerCase().substring(0, 30))
        );

        if (tpuMatch) {
          unitPrice = tpuMatch.preco;
          source = "TPU";
          confidence = 0.95;
          priceFound = true;
        }
      }

      // Segundo: buscar no histórico de preços do banco
      if (!priceFound && priceHistory && priceHistory.length > 0) {
        const historyMatch = priceHistory.find(
          (ph) =>
            ph.item_code === item.item_code ||
            ph.description.toLowerCase().includes(item.description.toLowerCase().substring(0, 30))
        );

        if (historyMatch) {
          unitPrice = historyMatch.unit_price;
          source = `Histórico (${historyMatch.source})`;
          confidence = 0.85;
          priceFound = true;
        }
      }

      // Terceiro: usar IA para estimar preço baseado em SINAPI/SICRO
      if (!priceFound) {
        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: `Você é um especialista em orçamentos de obras civis no Brasil. 
                  Sua tarefa é estimar o preço unitário de itens de construção baseado nas tabelas SINAPI e SICRO.
                  Responda APENAS com um JSON no formato: {"preco": number, "referencia": "SINAPI" ou "SICRO", "codigo_referencia": "codigo se souber"}
                  Se não conseguir estimar, responda: {"preco": 0, "referencia": "NAO_ENCONTRADO", "codigo_referencia": null}`
                },
                {
                  role: "user",
                  content: `Estime o preço unitário para: "${item.description}" (unidade: ${item.unit || "UN"})`
                }
              ],
              max_tokens: 200,
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content || "";
            
            try {
              // Extrair JSON da resposta
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const priceData = JSON.parse(jsonMatch[0]);
                if (priceData.preco > 0) {
                  unitPrice = priceData.preco;
                  source = priceData.referencia || "IA";
                  confidence = 0.7;
                  priceFound = true;
                }
              }
            } catch {
              console.log("Erro ao parsear resposta da IA para item:", item.description);
            }
          }
        } catch (aiError) {
          console.error("Erro na busca IA:", aiError);
        }
      }

      results.push({
        item_id: item.id,
        description: item.description,
        unit_price: unitPrice,
        source: source || "NAO_ENCONTRADO",
        confidence: confidence,
      });

      // Salvar no histórico se encontrou preço válido
      if (priceFound && unitPrice > 0) {
        await supabase.from("price_history").upsert(
          {
            user_id: userId,
            description: item.description,
            item_code: item.item_code,
            unit: item.unit || "UN",
            unit_price: unitPrice,
            source: source,
            reference_date: new Date().toISOString().split("T")[0],
          },
          { onConflict: "id" }
        );
      }
    }

    // Calcular estatísticas
    const found = results.filter((r) => r.unit_price > 0);
    const notFound = results.filter((r) => r.unit_price === 0);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          total_items: results.length,
          prices_found: found.length,
          prices_not_found: notFound.length,
          coverage_percentage: Math.round((found.length / results.length) * 100),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na geração de orçamento:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
