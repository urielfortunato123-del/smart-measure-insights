import { MeasurementEntry } from '@/types/measurement';

// Dados de demonstração para mostrar o sistema funcionando
export const demoMeasurements: MeasurementEntry[] = [
  {
    id: 'demo-1',
    item: '1.01',
    date: '2024-12-08',
    responsavel: 'Construtora Alpha',
    local: 'Trecho 01 - Km 5+200',
    disciplina: 'Terraplenagem',
    tipo: 'Movimentação de Terra',
    descricao: 'Escavação de material de 1ª categoria',
    quantidade: 2450.50,
    unidade: 'M3',
    valorUnitario: 18.75,
    valorTotal: 45946.88,
    status: 'normal'
  },
  {
    id: 'demo-2',
    item: '1.02',
    date: '2024-12-08',
    responsavel: 'Construtora Alpha',
    local: 'Trecho 01 - Km 5+200',
    disciplina: 'Terraplenagem',
    tipo: 'Movimentação de Terra',
    descricao: 'Compactação de aterro',
    quantidade: 1850.00,
    unidade: 'M3',
    valorUnitario: 12.50,
    valorTotal: 23125.00,
    status: 'normal'
  },
  {
    id: 'demo-3',
    item: '2.01',
    date: '2024-12-09',
    responsavel: 'Pavimentadora Beta',
    local: 'Trecho 02 - Km 7+500',
    disciplina: 'Pavimentação',
    tipo: 'Base e Sub-base',
    descricao: 'Base de brita graduada',
    quantidade: 890.00,
    unidade: 'M3',
    valorUnitario: 145.00,
    valorTotal: 129050.00,
    status: 'normal'
  },
  {
    id: 'demo-4',
    item: '2.02',
    date: '2024-12-09',
    responsavel: 'Pavimentadora Beta',
    local: 'Trecho 02 - Km 7+500',
    disciplina: 'Pavimentação',
    tipo: 'Revestimento',
    descricao: 'CBUQ - Concreto Betuminoso Usinado a Quente',
    quantidade: 3200.00,
    unidade: 'TON',
    valorUnitario: 285.00,
    valorTotal: 912000.00,
    status: 'normal'
  },
  {
    id: 'demo-5',
    item: '3.01',
    date: '2024-12-10',
    responsavel: 'Sinalta Sinalização',
    local: 'SP-250 - Km 57+500',
    disciplina: 'Sinalização',
    tipo: 'Horizontal',
    descricao: 'Pintura de faixa - cor branca',
    quantidade: 4500.00,
    unidade: 'M2',
    valorUnitario: 28.50,
    valorTotal: 128250.00,
    status: 'normal'
  },
  {
    id: 'demo-6',
    item: '3.02',
    date: '2024-12-10',
    responsavel: 'Sinalta Sinalização',
    local: 'SP-250 - Km 57+500',
    disciplina: 'Sinalização',
    tipo: 'Vertical',
    descricao: 'Placa de regulamentação R-1',
    quantidade: 45.00,
    unidade: 'UN',
    valorUnitario: 450.00,
    valorTotal: 20250.00,
    status: 'normal'
  },
  {
    id: 'demo-7',
    item: '3.03',
    date: '2024-12-10',
    responsavel: 'Sinalta Sinalização',
    local: 'SP-250 - Km 57+500',
    disciplina: 'Sinalização',
    tipo: 'Dispositivos de Segurança',
    descricao: 'Defensa metálica simples',
    quantidade: 850.00,
    unidade: 'M',
    valorUnitario: 712.03,
    valorTotal: 605225.50,
    status: 'outlier' // Alto valor - outlier detectado
  },
  {
    id: 'demo-8',
    item: '4.01',
    date: '2024-12-11',
    responsavel: 'Demolidora Diez',
    local: 'Praça de Pedágio',
    disciplina: 'Demolição',
    tipo: 'Estruturas',
    descricao: 'Demolição de estrutura de concreto',
    quantidade: 125.00,
    unidade: 'M3',
    valorUnitario: 185.00,
    valorTotal: 23125.00,
    status: 'normal'
  },
  {
    id: 'demo-9',
    item: '4.02',
    date: '2024-12-11',
    responsavel: 'Demolidora Diez',
    local: 'Praça de Pedágio',
    disciplina: 'Demolição',
    tipo: 'Remoção',
    descricao: 'Remoção de pavimento asfáltico',
    quantidade: 580.00,
    unidade: 'M2',
    valorUnitario: 35.00,
    valorTotal: 20300.00,
    status: 'normal'
  },
  {
    id: 'demo-10',
    item: '5.01',
    date: '2024-12-12',
    responsavel: 'Unicom Construções',
    local: 'Obra Civil - Sala Técnica',
    disciplina: 'Obra Civil',
    tipo: 'Fundações',
    descricao: 'Implantação da Sala Técnica - fundação',
    quantidade: 1.00,
    unidade: 'VB',
    valorUnitario: 289250.00,
    valorTotal: 289250.00,
    status: 'normal'
  },
  {
    id: 'demo-11',
    item: '5.02',
    date: '2024-12-12',
    responsavel: 'Unicom Construções',
    local: 'Obra Civil - Sala Técnica',
    disciplina: 'Obra Civil',
    tipo: 'Estrutura',
    descricao: 'Ferragem e concretagem',
    quantidade: 45.00,
    unidade: 'M3',
    valorUnitario: 1850.00,
    valorTotal: 83250.00,
    status: 'normal'
  },
  {
    id: 'demo-12',
    item: '6.01',
    date: '2024-12-12',
    responsavel: 'Construtora Alpha',
    local: 'Trecho 03 - Km 12+000',
    disciplina: 'Drenagem',
    tipo: 'Bueiros',
    descricao: 'Bueiro tubular de concreto DN 1000',
    quantidade: 85.00,
    unidade: 'M',
    valorUnitario: 1250.00,
    valorTotal: 106250.00,
    status: 'normal'
  },
  {
    id: 'demo-13',
    item: '6.02',
    date: '2024-12-12',
    responsavel: 'Construtora Alpha',
    local: 'Trecho 03 - Km 12+000',
    disciplina: 'Drenagem',
    tipo: 'Caixas',
    descricao: 'Caixa coletora em concreto armado',
    quantidade: 12.00,
    unidade: 'UN',
    valorUnitario: 8500.00,
    valorTotal: 102000.00,
    status: 'normal'
  },
  {
    id: 'demo-14',
    item: '7.01',
    date: '2024-12-12',
    responsavel: 'Elétrica Plus',
    local: 'Iluminação - Km 8 a 10',
    disciplina: 'Elétrica',
    tipo: 'Iluminação',
    descricao: 'Poste metálico cônico 12m',
    quantidade: 38.00,
    unidade: 'UN',
    valorUnitario: 4500.00,
    valorTotal: 171000.00,
    status: 'normal'
  },
  {
    id: 'demo-15',
    item: '7.02',
    date: '2024-12-12',
    responsavel: 'Elétrica Plus',
    local: 'Iluminação - Km 8 a 10',
    disciplina: 'Elétrica',
    tipo: 'Iluminação',
    descricao: 'Luminária LED 150W',
    quantidade: 38.00,
    unidade: 'UN',
    valorUnitario: 1850.00,
    valorTotal: 70300.00,
    status: 'normal'
  },
  // Itens com potenciais problemas para a IA detectar
  {
    id: 'demo-16',
    item: '8.01',
    date: '2024-12-12',
    responsavel: 'Construtora Alpha',
    local: 'Trecho 04',
    disciplina: 'Terraplenagem',
    tipo: 'Movimentação de Terra',
    descricao: 'Escavação de material de 1ª categoria',
    quantidade: 8500.00, // Quantidade muito acima do normal - outlier
    unidade: 'M3',
    valorUnitario: 18.75,
    valorTotal: 159375.00,
    status: 'outlier'
  },
  {
    id: 'demo-17',
    item: '9.01',
    date: '2024-12-12',
    responsavel: 'Pavimentadora Beta',
    local: 'Trecho 02',
    disciplina: 'Pavimentação',
    tipo: 'Base e Sub-base',
    descricao: 'Base de brita graduada - ERRO CÁLCULO',
    quantidade: 500.00,
    unidade: 'M3',
    valorUnitario: 145.00,
    valorTotal: 80000.00, // Deveria ser 72500 - erro de cálculo
    status: 'normal'
  }
];

// Empty initial data - user must upload their own spreadsheet
export const sampleMeasurements: MeasurementEntry[] = [];

export const getUniqueValues = (data: MeasurementEntry[], key: keyof MeasurementEntry): string[] => {
  return [...new Set(data.map(item => String(item[key] || '')))].filter(v => v !== '').sort();
};

export const calculateStats = (data: MeasurementEntry[]) => {
  const errorsCount = data.filter(item => {
    const calculated = item.quantidade * item.valorUnitario;
    const diff = Math.abs(calculated - item.valorTotal);
    return diff > 0.01 && item.valorTotal > 0;
  }).length;

  return {
    totalMeasured: data.reduce((sum, item) => sum + item.quantidade, 0),
    totalValue: data.reduce((sum, item) => sum + item.valorTotal, 0),
    itemCount: data.length,
    outlierCount: data.filter(item => item.status === 'outlier').length,
    errorsCount
  };
};

// Detect calculation errors in data
export const detectCalculationErrors = (data: MeasurementEntry[]): MeasurementEntry[] => {
  return data.map(item => {
    const calculatedValue = item.quantidade * item.valorUnitario;
    const difference = Math.abs(calculatedValue - item.valorTotal);
    const percentDiff = item.valorTotal > 0 ? (difference / item.valorTotal) * 100 : 0;
    
    // Mark as error if difference is more than 0.01% and value is significant
    const hasError = percentDiff > 0.01 && item.valorTotal > 0;
    
    return {
      ...item,
      calculatedValue,
      hasCalculationError: hasError,
      errorDifference: hasError ? difference : 0,
      errorPercent: hasError ? percentDiff : 0,
      status: hasError ? 'error' : item.status
    };
  });
};