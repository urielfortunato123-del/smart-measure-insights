# Backend - Engenharia Inteligente

## Arquitetura Atual

O backend atualmente utiliza **Supabase** como BaaS (Backend as a Service):

### Componentes Ativos

1. **Database (Postgres)**
   - Tabelas: projects, measurements, measurement_items, item_history, alerts
   - Row Level Security (RLS) habilitado
   - Triggers para updated_at automático

2. **Edge Functions (Deno/TypeScript)**
   - `analyze-measurement`: Análise de dados com IA

3. **Authentication**
   - Email/Password
   - Google OAuth

### Localização

- Edge Functions: `supabase/functions/`
- Tipos gerados: `src/integrations/supabase/types.ts`
- Cliente: `src/integrations/supabase/client.ts`

## Evolução Futura

Este diretório está preparado para um backend próprio quando necessário:

```
backend/
├── app/
│   ├── api/           # Endpoints REST
│   ├── services/      # Lógica de negócio
│   ├── models/        # Modelos de dados
│   └── utils/         # Utilitários
├── tests/             # Testes automatizados
├── requirements.txt   # Python deps (se FastAPI)
└── package.json       # Node deps (se Express)
```

### Quando migrar para backend próprio?

- Processamento pesado que excede limites do Edge Function
- Integrações complexas com sistemas legados
- Requisitos de compliance específicos
- Performance crítica em operações síncronas

### Stack recomendada

**Opção 1: Python + FastAPI**
- Excelente para IA/ML
- Async nativo
- OpenAPI automático

**Opção 2: Node.js + Express/Fastify**
- Mesma linguagem do frontend
- Ecossistema npm
- Fácil para time JS

Por enquanto, o Supabase atende todas as necessidades do MVP.
