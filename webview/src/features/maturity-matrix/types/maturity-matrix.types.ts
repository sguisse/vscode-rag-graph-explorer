export type {
  MaturityApplication,
  MaturityPillarDefinition,
  MaturityPillarValue,
  MaturityMatrixData,
} from '@/shared/services/maturity-matrix/model/assessments-json';

export type MaturityMatrixTabId = 'matrix' | 'compare' | 'extracts';

export type DateStatus = 'yellow' | 'green' | 'blue' | 'orange' | 'red';
