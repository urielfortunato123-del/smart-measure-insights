export interface TPUEntry {
  id: string;
  codigo: string;
  nome: string;
  unidade: string;
  precoUnitario: number;
  origem: 'DER-SP' | 'DNIT' | 'SINAPI' | 'Outro';
  tipo: 'desonerado' | 'nao_desonerado';
  dataReferencia?: string;
  versao?: string;
}

export interface TPUImportResult {
  entries: TPUEntry[];
  totalItems: number;
  origem: string;
  dataReferencia: string;
  tipo: 'desonerado' | 'nao_desonerado';
}
