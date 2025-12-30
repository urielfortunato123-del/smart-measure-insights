# Dados - Engenharia Inteligente

## Estrutura

```
data/
├── exemplos/          # Planilhas de exemplo para testes
├── schema/            # Definições de schema de dados
└── README.md
```

## Formato de Entrada

O sistema aceita planilhas Excel (.xlsx, .xls) com as seguintes colunas:

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| codigo | string | Não | Código do item |
| descricao | string | Sim | Descrição do serviço |
| unidade | string | Não | Unidade de medida |
| quantidade | number | Não | Quantidade medida |
| preco_unitario | number | Não | Preço por unidade |
| valor_total | number | Não | Valor total do item |
| disciplina | string | Não | Disciplina (ex: ESTRUTURA) |
| local | string | Não | Local na obra |
| responsavel | string | Não | Responsável pela medição |

## Schema do Banco

Ver arquivo `schema/database.sql` para definição completa das tabelas.

## Exemplos

Colocar planilhas de exemplo em `exemplos/` para:
- Testes de importação
- Demonstrações
- Validação de formatos
