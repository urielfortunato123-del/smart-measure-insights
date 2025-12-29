import { MeasurementEntry } from '@/types/measurement';

export const sampleMeasurements: MeasurementEntry[] = [
  {
    id: '1',
    date: '2024-01-15',
    responsavel: 'João Silva',
    local: 'Trecho A - Km 10',
    disciplina: 'Terraplanagem',
    descricao: 'Escavação de material de 1ª categoria',
    quantidade: 1250.5,
    unidade: 'm³',
    valorUnitario: 18.50,
    valorTotal: 23134.25,
    status: 'normal'
  },
  {
    id: '2',
    date: '2024-01-15',
    responsavel: 'Maria Santos',
    local: 'Trecho B - Km 25',
    disciplina: 'Pavimentação',
    descricao: 'CBUQ - Camada de rolamento',
    quantidade: 850.0,
    unidade: 'm²',
    valorUnitario: 125.00,
    valorTotal: 106250.00,
    status: 'normal'
  },
  {
    id: '3',
    date: '2024-01-16',
    responsavel: 'Carlos Oliveira',
    local: 'Trecho A - Km 12',
    disciplina: 'Drenagem',
    descricao: 'Bueiro tubular de concreto D=1.00m',
    quantidade: 45.0,
    unidade: 'm',
    valorUnitario: 890.00,
    valorTotal: 40050.00,
    status: 'normal'
  },
  {
    id: '4',
    date: '2024-01-17',
    responsavel: 'João Silva',
    local: 'Trecho C - Km 35',
    disciplina: 'Terraplanagem',
    descricao: 'Compactação de aterro',
    quantidade: 2100.0,
    unidade: 'm³',
    valorUnitario: 12.00,
    valorTotal: 25200.00,
    status: 'normal'
  },
  {
    id: '5',
    date: '2024-01-18',
    responsavel: 'Ana Costa',
    local: 'Trecho B - Km 28',
    disciplina: 'Sinalização',
    descricao: 'Pintura de faixa contínua',
    quantidade: 3500.0,
    unidade: 'm',
    valorUnitario: 8.50,
    valorTotal: 29750.00,
    status: 'normal'
  },
  {
    id: '6',
    date: '2024-01-19',
    responsavel: 'Maria Santos',
    local: 'Trecho A - Km 15',
    disciplina: 'Pavimentação',
    descricao: 'Base de brita graduada',
    quantidade: 1200.0,
    unidade: 'm²',
    valorUnitario: 45.00,
    valorTotal: 54000.00,
    status: 'normal'
  },
  {
    id: '7',
    date: '2024-01-20',
    responsavel: 'Carlos Oliveira',
    local: 'Trecho C - Km 40',
    disciplina: 'Drenagem',
    descricao: 'Sarjeta de concreto',
    quantidade: 320.0,
    unidade: 'm',
    valorUnitario: 95.00,
    valorTotal: 30400.00,
    status: 'normal'
  },
  {
    id: '8',
    date: '2024-01-21',
    responsavel: 'João Silva',
    local: 'Trecho B - Km 22',
    disciplina: 'Terraplanagem',
    descricao: 'Escavação em rocha',
    quantidade: 15000.0,
    unidade: 'm³',
    valorUnitario: 85.00,
    valorTotal: 1275000.00,
    status: 'outlier'
  },
  {
    id: '9',
    date: '2024-01-22',
    responsavel: 'Ana Costa',
    local: 'Trecho A - Km 18',
    disciplina: 'Sinalização',
    descricao: 'Instalação de defensas metálicas',
    quantidade: 450.0,
    unidade: 'm',
    valorUnitario: 320.00,
    valorTotal: 144000.00,
    status: 'normal'
  },
  {
    id: '10',
    date: '2024-01-23',
    responsavel: 'Maria Santos',
    local: 'Trecho C - Km 42',
    disciplina: 'Pavimentação',
    descricao: 'Imprimação betuminosa',
    quantidade: 2800.0,
    unidade: 'm²',
    valorUnitario: 6.50,
    valorTotal: 18200.00,
    status: 'normal'
  },
  {
    id: '11',
    date: '2024-01-24',
    responsavel: 'Carlos Oliveira',
    local: 'Trecho B - Km 30',
    disciplina: 'Obras de Arte',
    descricao: 'Concreto estrutural fck=30MPa',
    quantidade: 85.0,
    unidade: 'm³',
    valorUnitario: 1250.00,
    valorTotal: 106250.00,
    status: 'normal'
  },
  {
    id: '12',
    date: '2024-01-25',
    responsavel: 'João Silva',
    local: 'Trecho A - Km 8',
    disciplina: 'Terraplanagem',
    descricao: 'Regularização de subleito',
    quantidade: 4500.0,
    unidade: 'm²',
    valorUnitario: 3.20,
    valorTotal: 14400.00,
    status: 'normal'
  }
];

export const getUniqueValues = (data: MeasurementEntry[], key: keyof MeasurementEntry): string[] => {
  return [...new Set(data.map(item => String(item[key])))].sort();
};

export const calculateStats = (data: MeasurementEntry[]) => {
  return {
    totalMeasured: data.reduce((sum, item) => sum + item.quantidade, 0),
    totalValue: data.reduce((sum, item) => sum + item.valorTotal, 0),
    itemCount: data.length,
    outlierCount: data.filter(item => item.status === 'outlier').length
  };
};
