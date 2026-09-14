export type MaturityMatrixTabId = 'overview' | 'details' | 'report' | 'temp-html';

export interface MaturityCategory {
  id: string;
  name: string;
  icon: string;
  currentLevel: number;
  targetLevel: number;
  description: string;
  capabilities: string[];
}
