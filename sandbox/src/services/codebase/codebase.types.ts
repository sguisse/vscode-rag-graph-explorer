export interface CodebaseAttribute {
  name: string;
  visibility: 'private' | 'public' | 'protected';
}

export interface CodebaseMethod {
  id: string;
  name: string;
  description: string;
}

export interface ConfigProperty {
  key: string;
  value: string;
}

export interface CodebaseFile {
  id: string;
  name: string;
  type: 'class' | 'interface' | 'component' | 'module' | 'config';
  path: string;
  language: string;
  size: number;
  complexity: number;
  attributes?: CodebaseAttribute[];
  methods?: CodebaseMethod[];
  configProperties?: ConfigProperty[];
}

export interface Dependency {
  id: string;
  sourceNode: string;
  sourceHandle: string;
  targetNode: string;
  targetHandle: string;
  relation: 'dependency' | 'association' | 'aggregation' | 'composition' | 'implementation' | 'extends';
  label: string;
}

export interface CodebaseData {
  files: CodebaseFile[];
  dependencies: Dependency[];
}

export interface SelectedEntity {
  type: 'node' | 'member' | 'edge';
  nodeId: string;
  memberId?: string;
  edgeId?: string;
}

export type ImpactDirection = 'aval' | 'amont';
