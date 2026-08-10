export interface CodebaseAttribute {
  name: string;
  visibility: string;
}

export interface CodebaseMethod {
  id: string;
  name: string;
  description?: string;
}

export interface ConfigProperty {
  key: string;
  value: string;
}

export interface CodebaseFile {
  id: string;
  name: string;
  type: 'class' | 'interface' | 'component' | 'module' | 'config' | string;
  path: string;
  language: string;
  size?: number;
  complexity?: number;
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
  relation: string;
  label: string;
  source?: string;
  target?: string;
}

export interface CodebaseData {
  files: CodebaseFile[];
  dependencies: Dependency[];
}

export type ImpactDirection = 'callee' | 'caller';

export interface SelectedEntity {
  type: 'node' | 'member';
  nodeId: string;
  memberId?: string;
  edgeId?: string;
}
