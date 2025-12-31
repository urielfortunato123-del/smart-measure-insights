export interface MindMapNode {
  id: string;
  type: 'main' | 'methodology' | 'tpu' | 'attention' | 'calculation' | 'custom';
  title: string;
  description?: string;
  children?: MindMapNode[];
  expanded?: boolean;
  color?: string;
}

export interface MindMapData {
  id: string;
  topic: string;
  createdAt: Date;
  nodes: MindMapNode[];
}

export interface GenerateMindMapRequest {
  topic: string;
  context?: string;
}

export interface GenerateMindMapResponse {
  nodes: MindMapNode[];
  suggestions?: string[];
}
