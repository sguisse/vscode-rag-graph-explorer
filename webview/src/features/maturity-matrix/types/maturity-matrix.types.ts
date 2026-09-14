export type MaturityMatrixTabId = 'matrix' | 'compare' | 'extracts';

export type DateStatus = 'yellow' | 'green' | 'blue' | 'red';

export interface MaturityPillarDefinition {
  key: string;
  label: string;
  icon: string;
  rowOffset: number;
}

export interface MaturityPillarValue {
  key: string;
  label: string;
  icon: string;
  assessor: string;
  date: string | null;
  score: number;
  level: string;
  prevDate: string | null;
  prevScore: number;
  prevLevel: string;
  target: boolean;
  lastExtract: number;
  prevExtract: number;
}

export interface MaturityApplication {
  id: string;
  name: string;
  code: string;
  leader: string;
  toGenerate: boolean;
  lastAssessmentDate: string | null;
  prevAssessmentDate: string | null;
  commentary: string;
  startRow?: number;
  rowIdx?: number;
  pillars: Record<string, MaturityPillarValue>;
}

export interface MaturityMatrixData {
  updatedAt: string;
  generatedAt: string;
  pillars: MaturityPillarDefinition[];
  applications: MaturityApplication[];
}

export interface MaturityCategory {
  id: string;
  name: string;
  icon: string;
  currentLevel: number;
  targetLevel: number;
  description: string;
  capabilities: string[];
}
