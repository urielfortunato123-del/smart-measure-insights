# Fluxo de Inteligência Artificial

## Visão Geral

O sistema utiliza IA para transformar dados brutos de medição em insights acionáveis.

## Pipeline de Análise

```
┌────────────────────────────────────────────────────────────┐
│                    ENTRADA DE DADOS                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  Excel   │  │  Manual  │  │   API    │                 │
│  │  Import  │  │  Entry   │  │  Future  │                 │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                 │
└───────┼─────────────┼─────────────┼────────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌────────────────────────────────────────────────────────────┐
│              NORMALIZAÇÃO E VALIDAÇÃO                       │
│  • Parsing de formatos                                      │
│  • Validação de campos obrigatórios                        │
│  • Conversão de unidades                                    │
│  • Cálculo de totais                                        │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│                 ANÁLISE ESTATÍSTICA                         │
│  • Cálculo de média e desvio padrão                        │
│  • Identificação de outliers (Z-score > 2)                 │
│  • Detecção de erros de cálculo                            │
│  • Comparação com histórico                                 │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│                   ANÁLISE COM IA                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              PROMPT ENGINEERING                      │  │
│  │  • Contexto do item (código, descrição, valores)    │  │
│  │  • Tipo de anomalia detectada                        │  │
│  │  • Dados históricos relevantes                       │  │
│  │  • Instrução para resposta estruturada               │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           LOVABLE AI GATEWAY                         │  │
│  │  • Modelo: Gemini 2.5 Flash (rápido)                │  │
│  │  • Fallback: GPT-5 (complexo)                       │  │
│  │  • Temperatura: 0.3 (consistente)                   │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│                 GERAÇÃO DE ALERTAS                          │
│  • Classificação de severidade (crítico/atenção/info)      │
│  • Explicação em linguagem natural                          │
│  • Recomendação de ação                                     │
│  • Valores corretos sugeridos                               │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│                   DASHBOARD                                 │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │
│  │  KPIs  │  │ Charts │  │ Alerts │  │ Table  │          │
│  └────────┘  └────────┘  └────────┘  └────────┘          │
└────────────────────────────────────────────────────────────┘
```

## Tipos de Análise

### 1. Detecção de Outliers
```
Método: Z-Score > 2 desvios padrão
Entrada: Lista de valores da mesma disciplina
Saída: Itens com valores anômalos
```

### 2. Erros de Cálculo
```
Método: Comparação quantidade × preço unitário ≠ total
Entrada: Item com qty, unit_price, total
Saída: Diferença detectada + valor correto
```

### 3. Análise Contextual (IA)
```
Método: LLM analisa contexto completo
Entrada: Item + histórico + padrões
Saída: Explicação + recomendação
```

## Exemplo de Prompt

```
Você é um especialista em medição de obras de engenharia civil.

Analise este item de medição que foi identificado como outlier:

Item: CONCRETO FCK 30 MPA
Código: 03.02.001
Quantidade: 150 m³
Valor Unitário: R$ 450,00
Valor Total: R$ 67.500,00

Estatísticas da disciplina ESTRUTURA:
- Média de valores: R$ 25.000
- Desvio padrão: R$ 12.000
- Este item está 3.5 desvios acima da média

Forneça:
1. Explicação do problema (máximo 2 frases)
2. Possíveis causas
3. Recomendação de ação
4. Se o valor parece correto ou incorreto
```

## Resposta Estruturada

```json
{
  "explanation": "O valor deste item de concreto está significativamente acima da média histórica para itens de estrutura.",
  "possibleCauses": [
    "Quantidade maior que o usual para este tipo de elemento",
    "Preço unitário acima do mercado",
    "Possível erro de digitação na quantidade"
  ],
  "recommendation": "Verificar memorial de cálculo e conferir quantidade com projeto estrutural.",
  "assessment": "REQUER_VERIFICACAO",
  "confidence": 0.85
}
```

## Métricas de Qualidade

| Métrica | Meta | Atual |
|---------|------|-------|
| Precisão de detecção | >90% | Em validação |
| Tempo de resposta | <3s | ~2s |
| Falsos positivos | <10% | Em validação |
| Cobertura de análise | 100% | 100% |

## Evolução Planejada

1. **Curto prazo**
   - Análise comparativa entre medições
   - Detecção de itens duplicados
   - Sugestão de agrupamentos

2. **Médio prazo**
   - Previsão de valores futuros
   - Detecção de padrões sazonais
   - Benchmark entre projetos

3. **Longo prazo**
   - Aprendizado com correções do usuário
   - Modelo fine-tuned para construção civil
   - Integração com sistemas ERP
