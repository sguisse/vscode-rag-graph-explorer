import {
  AttributeVisibility,
  FileType,
  DependencyRelation,
  SelectedEntityType,
  ImpactDirection
} from './types';

export * from './types';

export interface CodebaseAttribute {
  name: string;
  visibility: AttributeVisibility;
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
  type: FileType;
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
  relation: DependencyRelation;
  label: string;
}

export interface CodebaseData {
  files: CodebaseFile[];
  dependencies: Dependency[];
}

export interface SelectedEntity {
  type: SelectedEntityType;
  nodeId: string;
  memberId?: string;
  edgeId?: string;
}

export type { ImpactDirection };
