import type { MaturityMatrixResult } from '../model';

export interface IMaturityMatrixServicePort {
  extractAssessments(): Promise<MaturityMatrixResult>;
  extractMaturityMatrix(): Promise<MaturityMatrixResult>;
}
