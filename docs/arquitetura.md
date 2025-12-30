# Arquitetura Técnica

## Visão Geral

O sistema segue uma arquitetura moderna de aplicação web com:
- **Frontend SPA** (Single Page Application) em React
- **Backend Serverless** via Supabase
- **IA como Serviço** via Lovable AI Gateway

## Camadas

### 1. Apresentação (Frontend)

```
React 18 + TypeScript + Vite
├── Componentes visuais (shadcn/ui)
├── Gerenciamento de estado (TanStack Query)
├── Roteamento (React Router)
└── Estilização (Tailwind CSS)
```

**Responsabilidades:**
- Renderização da interface
- Gerenciamento de estado local
- Chamadas à API
- Validação de formulários

### 2. Lógica de Negócio (Edge Functions)

```
Supabase Edge Functions (Deno + TypeScript)
├── analyze-measurement  → Análise com IA
└── (futuras funções)
```

**Responsabilidades:**
- Processamento de dados
- Integração com IA
- Lógica complexa de negócio
- Validações server-side

### 3. Persistência (Database)

```
Supabase Postgres
├── projects           → Projetos de medição
├── measurements       → Medições por período
├── measurement_items  → Itens de cada medição
├── item_history       → Histórico de alterações
└── alerts             → Alertas gerados pela IA
```

**Responsabilidades:**
- Armazenamento persistente
- Row Level Security (RLS)
- Triggers automáticos
- Relacionamentos

### 4. Inteligência Artificial

```
Lovable AI Gateway
├── Gemini 2.5 Flash (análise rápida)
└── GPT-5 (análise complexa)
```

**Responsabilidades:**
- Análise de outliers
- Geração de explicações
- Recomendações de ação
- Detecção de padrões

## Fluxo de Dados

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  User   │───▶│ Frontend│───▶│  Edge   │───▶│   AI    │
│ Action  │    │  React  │    │Function │    │ Gateway │
└─────────┘    └────┬────┘    └────┬────┘    └────┬────┘
                    │              │              │
                    ▼              ▼              ▼
               ┌─────────┐    ┌─────────┐    ┌─────────┐
               │  State  │    │Database │    │Response │
               │ Update  │◀───│ Supabase│◀───│  JSON   │
               └─────────┘    └─────────┘    └─────────┘
```

## Segurança

### Autenticação
- Supabase Auth (JWT tokens)
- Google OAuth 2.0
- Session management automático

### Autorização
- Row Level Security (RLS) em todas as tabelas
- Políticas por user_id
- Tokens de curta duração

### Dados
- Conexões HTTPS/TLS
- Senhas hasheadas (bcrypt)
- Secrets em variáveis de ambiente

## Escalabilidade

| Componente | Estratégia |
|------------|------------|
| Frontend | CDN (Lovable/Vercel) |
| Edge Functions | Serverless auto-scaling |
| Database | Supabase managed Postgres |
| AI | Gateway com rate limiting |

## Monitoramento

- Logs de Edge Functions
- Analytics de uso
- Alertas de erro
- Métricas de performance
