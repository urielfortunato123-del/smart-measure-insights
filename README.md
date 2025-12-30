# Engenharia Inteligente de Medições

Sistema visual de medição inteligente onde a planilha é apenas a entrada e a **Inteligência Artificial** executa automaticamente a análise, comparação histórica, detecção de outliers e geração de alertas executivos.

![Status](https://img.shields.io/badge/status-MVP%20Funcional-green)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20TypeScript-blue)
![Backend](https://img.shields.io/badge/backend-Supabase%20%2B%20Edge%20Functions-orange)

## 🎯 Conceito

- **A IA faz o trabalho pesado** — análise automática, detecção de anomalias
- **O usuário apenas enxerga e decide** — interface visual executiva
- **Comparação automática** entre medições históricas
- **Histórico vivo** por item e disciplina
- **Visual executivo** com semáforo de risco e KPIs inteligentes

## 🧠 Funcionalidades

### Dashboard Inteligente
- KPIs em tempo real (Total Medido, Valor, Itens, Alertas)
- Gráficos de evolução temporal
- Composição por disciplina
- Tabela de dados com status visual

### Análise com IA
- Detecção automática de outliers estatísticos
- Identificação de erros de cálculo
- Alertas com explicação detalhada
- Recomendações de ação baseadas em IA

### Gestão de Dados
- Importação de planilhas Excel
- Filtros por responsável, local e disciplina
- Entrada rápida de medições
- Exportação de relatórios

### Autenticação
- Login com email/senha
- Login com Google OAuth
- Recuperação de senha
- Sessões seguras

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │Dashboard│  │ Charts  │  │ Alerts  │  │  Auth   │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │
└───────┼────────────┼────────────┼────────────┼──────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────┐
│                 SUPABASE (Backend)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Database   │  │Edge Functions│  │    Auth     │     │
│  │ (Postgres)  │  │  (Deno/TS)  │  │   (OAuth)   │     │
│  └─────────────┘  └──────┬──────┘  └─────────────┘     │
└──────────────────────────┼──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              LOVABLE AI GATEWAY                          │
│         (Gemini 2.5 Flash / GPT-5)                      │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18, TypeScript, Vite |
| Estilização | Tailwind CSS, shadcn/ui |
| Estado | TanStack Query, React Context |
| Backend | Supabase (Postgres + Edge Functions) |
| IA | Lovable AI Gateway (Gemini/GPT) |
| Auth | Supabase Auth (Email + Google OAuth) |
| Gráficos | Recharts |

## 📁 Estrutura do Projeto

```
├── src/
│   ├── components/
│   │   ├── dashboard/     # Componentes do dashboard
│   │   ├── layout/        # Header, Sidebar
│   │   ├── sidebar/       # Painéis laterais
│   │   └── ui/            # Componentes base (shadcn)
│   ├── hooks/             # Custom hooks (auth, toast)
│   ├── lib/               # Utilitários e analytics
│   ├── pages/             # Páginas (Index, Auth)
│   ├── types/             # Tipos TypeScript
│   └── integrations/      # Configuração Supabase
├── supabase/
│   └── functions/         # Edge Functions
├── docs/                  # Documentação
├── backend/               # Backend próprio (futuro)
├── data/                  # Schemas e exemplos
└── public/                # Assets estáticos
```

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📊 Status do Projeto

- ✅ MVP funcional (frontend completo)
- ✅ Dashboard com KPIs e gráficos
- ✅ Análise de IA com Edge Functions
- ✅ Sistema de alertas inteligentes
- ✅ Autenticação (email + Google)
- ⏳ Persistência histórica no banco
- ⏳ Relatórios exportáveis em PDF
- ⏳ Comparação entre períodos

## 📚 Documentação

- [Visão Geral](docs/visao-geral.md)
- [Arquitetura Técnica](docs/arquitetura.md)
- [Fluxo de Inteligência](docs/fluxo-inteligencia.md)

## 📄 Licença

Desenvolvido por **Uriel da Fonseca Fortunato**

---

> *"A planilha é só a entrada. A inteligência está no sistema."*
