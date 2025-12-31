import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  Upload, 
  FileSpreadsheet, 
  Sparkles, 
  GitCompareArrows,
  Filter,
  MessageSquare,
  LayoutDashboard,
  AlertTriangle,
  Download,
  Play,
  ChevronRight,
  Target,
  BarChart3,
  Settings,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Brain
} from 'lucide-react';
import { updates } from '@/components/updates/UpdatesNotification';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  steps: {
    step: number;
    title: string;
    description: string;
    tip?: string;
  }[];
  relatedUpdate?: string; // ID da atualização relacionada
}

// Seções do manual - automaticamente incluem funcionalidades das atualizações
const guideSections: GuideSection[] = [
  {
    id: 'getting-started',
    title: 'Primeiros Passos',
    icon: <Play className="h-5 w-5" />,
    description: 'Aprenda a começar a usar a plataforma rapidamente',
    steps: [
      {
        step: 1,
        title: 'Faça login na plataforma',
        description: 'Acesse a página de login e entre com seu email e senha. Se ainda não tem uma conta, clique em "Criar conta" para se registrar.',
        tip: 'Use um email válido para recuperar sua senha caso necessário.'
      },
      {
        step: 2,
        title: 'Explore o Dashboard',
        description: 'Após o login, você verá o painel principal (Dashboard) com todas as ferramentas disponíveis na barra lateral esquerda.',
        tip: 'Clique em "Carregar Demonstração" para ver dados de exemplo e entender como funciona.'
      },
      {
        step: 3,
        title: 'Importe sua primeira planilha',
        description: 'Use o botão "Importar Planilha" na barra lateral para carregar seus dados de medição no formato Excel ou CSV.',
        tip: 'Certifique-se que sua planilha tem cabeçalhos na primeira linha.'
      }
    ]
  },
  {
    id: 'import-data',
    title: 'Importar Dados',
    icon: <Upload className="h-5 w-5" />,
    description: 'Como importar planilhas de medição e TPU',
    steps: [
      {
        step: 1,
        title: 'Prepare sua planilha',
        description: 'Organize sua planilha com colunas claras: Código do Item, Descrição, Unidade, Quantidade, Preço Unitário, Valor Total, Disciplina, Local e Responsável.',
        tip: 'Use a mesma estrutura para todas as planilhas para facilitar comparações.'
      },
      {
        step: 2,
        title: 'Clique em "Importar Planilha"',
        description: 'Na barra lateral, localize a seção "Importar Planilha" e clique no botão ou arraste o arquivo diretamente para a área indicada.',
      },
      {
        step: 3,
        title: 'Selecione o arquivo',
        description: 'Escolha um arquivo Excel (.xlsx, .xls) ou CSV do seu computador. O sistema processará automaticamente os dados.',
        tip: 'Arquivos muito grandes podem demorar alguns segundos para processar.'
      },
      {
        step: 4,
        title: 'Verifique os dados importados',
        description: 'Após a importação, os dados aparecerão no Dashboard com gráficos, KPIs e tabela de detalhes. Confira se tudo foi importado corretamente.',
      }
    ]
  },
  {
    id: 'tpu-upload',
    title: 'Carregar TPU',
    icon: <FileSpreadsheet className="h-5 w-5" />,
    description: 'Importe a Tabela de Preços Unitários para referência',
    steps: [
      {
        step: 1,
        title: 'Localize a seção TPU',
        description: 'Na barra lateral, encontre a seção "Carregar TPU" abaixo da importação de planilhas.',
      },
      {
        step: 2,
        title: 'Faça upload da TPU',
        description: 'Clique em "Selecionar Arquivo" e escolha sua planilha de Tabela de Preços Unitários. O formato esperado inclui: Código, Descrição, Unidade e Preço.',
        tip: 'A TPU será usada como referência para validar preços e identificar inconsistências.'
      },
      {
        step: 3,
        title: 'Aguarde o processamento',
        description: 'O sistema lerá os dados da TPU e os disponibilizará para autocomplete no formulário de entrada rápida e para comparações.',
      }
    ]
  },
  {
    id: 'quick-entry',
    title: 'Entrada Rápida',
    icon: <Target className="h-5 w-5" />,
    description: 'Adicione itens de medição manualmente',
    steps: [
      {
        step: 1,
        title: 'Acesse o formulário',
        description: 'Na barra lateral, localize "Entrada Rápida". Este formulário permite adicionar itens individualmente.',
      },
      {
        step: 2,
        title: 'Preencha os campos',
        description: 'Digite a descrição do item (com autocomplete se TPU estiver carregada), selecione disciplina, local, quantidade e valor.',
        tip: 'O autocomplete sugere itens da TPU conforme você digita, facilitando a padronização.'
      },
      {
        step: 3,
        title: 'Adicione o item',
        description: 'Clique em "Adicionar" para incluir o item na medição atual. Ele aparecerá automaticamente nos gráficos e tabela.',
      }
    ]
  },
  {
    id: 'filters',
    title: 'Filtros',
    icon: <Filter className="h-5 w-5" />,
    description: 'Filtre e segmente seus dados de medição',
    steps: [
      {
        step: 1,
        title: 'Abra o painel de filtros',
        description: 'Na barra lateral, encontre a seção "Filtros" com opções para refinar os dados exibidos.',
      },
      {
        step: 2,
        title: 'Selecione os critérios',
        description: 'Escolha filtros por Responsável, Local ou Disciplina. Você pode combinar múltiplos filtros.',
        tip: 'Os filtros são aplicados em tempo real - veja os gráficos se atualizarem instantaneamente.'
      },
      {
        step: 3,
        title: 'Limpe os filtros',
        description: 'Para ver todos os dados novamente, clique em "Limpar Filtros" ou desmarque os filtros aplicados.',
      }
    ]
  },
  {
    id: 'ai-assistant',
    title: 'Assistente IA',
    icon: <MessageSquare className="h-5 w-5" />,
    description: 'Tire dúvidas e obtenha insights com inteligência artificial',
    relatedUpdate: 'v1.3.0',
    steps: [
      {
        step: 1,
        title: 'Localize o assistente',
        description: 'Na barra lateral, no final, encontre a seção "Assistente IA" com um campo para digitar perguntas.',
      },
      {
        step: 2,
        title: 'Faça uma pergunta',
        description: 'Digite sua dúvida sobre os dados, como "Qual disciplina tem maior valor?" ou "Identifique outliers na medição".',
        tip: 'A IA analisa os dados importados para responder com base em informações reais.'
      },
      {
        step: 3,
        title: 'Receba insights',
        description: 'O assistente responderá com análises, sugestões e identificação de padrões nos seus dados de medição.',
      }
    ]
  },
  {
    id: 'ai-analysis',
    title: 'Análise Inteligente',
    icon: <Sparkles className="h-5 w-5" />,
    description: 'Detecte erros e inconsistências automaticamente com IA',
    relatedUpdate: 'v1.5.0',
    steps: [
      {
        step: 1,
        title: 'Acesse a página de análise',
        description: 'No cabeçalho do Dashboard, clique no botão "Análise IA" para abrir a ferramenta de análise inteligente.',
      },
      {
        step: 2,
        title: 'Carregue uma planilha',
        description: 'Arraste ou selecione uma planilha Excel ou CSV para análise. A planilha será exibida em formato editável.',
        tip: 'Você pode editar células diretamente na planilha como faria no Excel.'
      },
      {
        step: 3,
        title: 'Execute a análise',
        description: 'Clique no botão "Analisar com IA" no canto superior direito. A inteligência artificial processará seus dados.',
      },
      {
        step: 4,
        title: 'Visualize os erros',
        description: 'Células com problemas serão destacadas em cores diferentes: vermelho para erros graves, amarelo para avisos e azul para informações.',
        tip: 'Passe o mouse sobre células coloridas para ver a explicação detalhada do problema.'
      },
      {
        step: 5,
        title: 'Corrija os problemas',
        description: 'Use o resumo à esquerda para ver a contagem de problemas. Clique nas células para editá-las diretamente e corrigir os erros.',
      }
    ]
  },
  {
    id: 'comparison',
    title: 'Comparar Arquivos',
    icon: <GitCompareArrows className="h-5 w-5" />,
    description: 'Compare medições ou TPU de diferentes períodos',
    relatedUpdate: 'v1.4.0',
    steps: [
      {
        step: 1,
        title: 'Acesse a comparação',
        description: 'No cabeçalho do Dashboard, clique no botão "Comparar" para abrir a ferramenta de comparação.',
      },
      {
        step: 2,
        title: 'Escolha o tipo de comparação',
        description: 'Selecione se deseja comparar arquivos TPU ou planilhas de Medição usando as abas disponíveis.',
      },
      {
        step: 3,
        title: 'Carregue o arquivo base',
        description: 'Faça upload do primeiro arquivo (geralmente o mais antigo ou de referência).',
        tip: 'O arquivo base serve como referência para identificar diferenças.'
      },
      {
        step: 4,
        title: 'Carregue o arquivo de comparação',
        description: 'Faça upload do segundo arquivo (geralmente o mais recente ou a ser verificado).',
      },
      {
        step: 5,
        title: 'Visualize os resultados',
        description: 'O sistema mostrará itens adicionados (verde), removidos (vermelho) e alterados (amarelo) com detalhes das diferenças.',
      }
    ]
  },
  {
    id: 'mindmap',
    title: 'Mapa Mental',
    icon: <Brain className="h-5 w-5" />,
    description: 'Gere guias de medição completos com inteligência artificial',
    relatedUpdate: 'v1.6.0',
    steps: [
      {
        step: 1,
        title: 'Acesse o Mapa Mental',
        description: 'No cabeçalho do Dashboard, clique no botão "Mapa Mental" para abrir a ferramenta.',
      },
      {
        step: 2,
        title: 'Digite o serviço',
        description: 'No campo de texto à esquerda, digite o serviço de engenharia que deseja medir (ex: "Revestimento cerâmico", "Pintura externa").',
        tip: 'Seja específico no nome do serviço para obter resultados mais precisos.'
      },
      {
        step: 3,
        title: 'Gere com IA',
        description: 'Clique em "Gerar com IA" e aguarde a inteligência artificial criar o mapa mental completo.',
      },
      {
        step: 4,
        title: 'Explore os nós',
        description: 'O mapa será organizado em 4 categorias: Metodologia (como medir), TPU/SINAPI (códigos), Atenção (cuidados) e Cálculo (fórmulas).',
        tip: 'Clique nos nós para expandir e ver sub-itens com mais detalhes.'
      },
      {
        step: 5,
        title: 'Edite e personalize',
        description: 'Use os botões de edição para modificar títulos e descrições. Adicione novos nós clicando no "+" de cada item.',
      },
      {
        step: 6,
        title: 'Salve no histórico',
        description: 'Seus mapas são salvos automaticamente no histórico à esquerda. Clique para carregar mapas anteriores.',
      }
    ]
  },
  {
    id: 'dashboard',
    title: 'Dashboard e KPIs',
    icon: <LayoutDashboard className="h-5 w-5" />,
    description: 'Entenda os indicadores e gráficos do painel',
    steps: [
      {
        step: 1,
        title: 'Conheça os KPIs',
        description: 'No topo do Dashboard, 4 cards mostram: Total Medido (quantidade), Valor Total (R$), Itens Lançados e Alertas detectados.',
        tip: 'Clique no card de Alertas para ver detalhes das inconsistências encontradas.'
      },
      {
        step: 2,
        title: 'Analise o gráfico de evolução',
        description: 'O gráfico de barras mostra a evolução temporal das medições, permitindo identificar tendências e picos.',
      },
      {
        step: 3,
        title: 'Veja a composição',
        description: 'O gráfico de pizza mostra a distribuição por disciplina, ajudando a entender onde está concentrado o maior valor.',
      },
      {
        step: 4,
        title: 'Explore a tabela de dados',
        description: 'A tabela completa lista todos os itens com busca, ordenação e paginação. Use para ver detalhes de cada item.',
      }
    ]
  },
  {
    id: 'alerts',
    title: 'Alertas e Problemas',
    icon: <AlertTriangle className="h-5 w-5" />,
    description: 'Entenda e resolva alertas detectados pela IA',
    steps: [
      {
        step: 1,
        title: 'Verifique o painel de alertas',
        description: 'À esquerda da tabela de dados, o painel de alertas lista todas as inconsistências e problemas detectados.',
      },
      {
        step: 2,
        title: 'Entenda os tipos de alerta',
        description: 'Alertas incluem: erros de cálculo, valores fora do padrão (outliers), dados duplicados e campos faltantes.',
        tip: 'Cada alerta tem uma explicação gerada por IA do problema e possível solução.'
      },
      {
        step: 3,
        title: 'Clique para ver detalhes',
        description: 'Ao clicar em um alerta, um modal mostra informações detalhadas sobre o problema e o item relacionado.',
      },
      {
        step: 4,
        title: 'Tome ação',
        description: 'Use as informações para corrigir os dados na fonte (planilha original) e reimporte para verificar as correções.',
      }
    ]
  },
  {
    id: 'export',
    title: 'Exportar Dashboard',
    icon: <Download className="h-5 w-5" />,
    description: 'Salve uma imagem do painel para relatórios',
    steps: [
      {
        step: 1,
        title: 'Prepare a visualização',
        description: 'Ajuste os filtros e dados para mostrar exatamente o que deseja exportar.',
        tip: 'Certifique-se que todos os gráficos estão carregados antes de exportar.'
      },
      {
        step: 2,
        title: 'Clique no botão de exportar',
        description: 'No cabeçalho, clique no ícone de câmera/imagem para iniciar a exportação.',
      },
      {
        step: 3,
        title: 'Baixe a imagem',
        description: 'O sistema gerará uma imagem PNG de alta resolução do Dashboard e iniciará o download automaticamente.',
      }
    ]
  },
  {
    id: 'layout',
    title: 'Personalizar Layout',
    icon: <Settings className="h-5 w-5" />,
    description: 'Ajuste a interface às suas preferências',
    relatedUpdate: 'v1.2.0',
    steps: [
      {
        step: 1,
        title: 'Acesse os controles de layout',
        description: 'No cabeçalho do Dashboard, encontre o botão de configuração de layout (ícone de colunas).',
      },
      {
        step: 2,
        title: 'Escolha a posição da sidebar',
        description: 'Selecione entre: esquerda, direita, topo, embaixo ou oculta, conforme sua preferência.',
        tip: 'Suas preferências são salvas automaticamente para a próxima sessão.'
      },
      {
        step: 3,
        title: 'Redimensione os painéis',
        description: 'Arraste as bordas entre os painéis para ajustar o tamanho de cada área do Dashboard.',
      }
    ]
  }
];

interface UserGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserGuide = ({ open, onOpenChange }: UserGuideProps) => {
  const [selectedSection, setSelectedSection] = useState<string>('getting-started');

  const currentSection = guideSections.find(s => s.id === selectedSection);
  const relatedUpdate = currentSection?.relatedUpdate 
    ? updates.find(u => u.id === currentSection.relatedUpdate)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 rounded-full p-3">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Manual do Usuário</DialogTitle>
              <DialogDescription>
                Guia completo de como utilizar todas as ferramentas da plataforma
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Sidebar com lista de seções */}
          <div className="w-64 border-r bg-muted/30 flex-shrink-0">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {guideSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                      selectedSection === section.id
                        ? 'bg-primary/20 text-primary'
                        : 'text-card-foreground hover:bg-muted'
                    }`}
                  >
                    <div className={`${selectedSection === section.id ? 'text-primary' : 'text-muted-foreground'}`}>
                      {section.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{section.title}</p>
                      {section.relatedUpdate && (
                        <Badge variant="secondary" className="text-[10px] mt-1 px-1.5 py-0">
                          Novidade
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Conteúdo da seção */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {currentSection && (
                <div className="space-y-6">
                  {/* Cabeçalho da seção */}
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 rounded-xl p-4">
                      <div className="text-primary">{currentSection.icon}</div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2">{currentSection.title}</h2>
                      <p className="text-muted-foreground">{currentSection.description}</p>
                      
                      {relatedUpdate && (
                        <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-green-500">
                              Novidade v{relatedUpdate.version}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{relatedUpdate.description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Passos */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Passo a passo
                    </h3>
                    
                    <div className="space-y-4">
                      {currentSection.steps.map((step, index) => (
                        <Card key={step.step} className="relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                                {step.step}
                              </div>
                              <CardTitle className="text-base">{step.title}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-muted-foreground mb-3">{step.description}</p>
                            {step.tip && (
                              <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-amber-200/80">{step.tip}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Próximos passos */}
                  {selectedSection !== 'getting-started' && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <Button 
                          variant="ghost" 
                          onClick={() => setSelectedSection('getting-started')}
                        >
                          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                          Voltar ao início
                        </Button>
                        
                        {guideSections.findIndex(s => s.id === selectedSection) < guideSections.length - 1 && (
                          <Button 
                            onClick={() => {
                              const currentIndex = guideSections.findIndex(s => s.id === selectedSection);
                              if (currentIndex < guideSections.length - 1) {
                                setSelectedSection(guideSections[currentIndex + 1].id);
                              }
                            }}
                          >
                            Próximo tópico
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HelpCircle className="h-4 w-4" />
              <span>Dúvidas? Use o Assistente IA na barra lateral</span>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};