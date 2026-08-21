import { FileType } from "./types";

export interface CodebaseAttribute {
  visibility: string;
  name: string;
}

export interface CodebaseMethod {
  id: string;
  visibility: string;
  name: string;
  signature?: string;
  description?: string;
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
  size?: number;
  complexity?: number;
  tags?: string[];
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
