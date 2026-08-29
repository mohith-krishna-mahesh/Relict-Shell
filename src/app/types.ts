export interface Project {
  id: string;
  name: string;
  species: string;
  speciesTaxonomyId: string;
  scope: string;
  objective: string;
  createdAt: string;
  _count?: { runs: number };
}

export interface RunRecord {
  id: string;
  coreRunId: string;
  status: string;
  objective: string;
  result: unknown;
  createdAt: string;
}

export interface UserProfile {
  id?: string;
  login?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

export interface CoreSettings {
  baseUrl?: string;
  apiKeyConfigured?: boolean;
  connected?: boolean;
  version?: string;
}

export type StrategyId = string;

export interface GraphNodeData {
  id: string;
  label: string;
  type?: string;
  description?: string;
  score?: number;
  strategyId?: string;
  [key: string]: unknown;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  label?: string;
  confidence?: 'evidence' | 'model_estimated' | 'unknown';
  score?: number;
  [key: string]: unknown;
}

export interface GraphElements {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
}

export interface Strategy {
  id: string;
  name: string;
  summary?: string;
  rationale?: string;
  confidence?: number;
  genes?: string[];
  [key: string]: unknown;
}
