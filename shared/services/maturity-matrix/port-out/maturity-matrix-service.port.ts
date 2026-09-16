import type { AssessmentsPyReport, AssessmentsPyResult } from '../model/index';
import { MaturityMatrixData } from '../model/assessments-json';

export interface IMaturityMatrixServicePort {
  refreshAssessments(): Promise<AssessmentsPyReport>;
  getLastAssessments(): Promise<MaturityMatrixData>;
  getAssessmentsAt(datetimeExtract: string): Promise<MaturityMatrixData>;
  getAssessmentsAvailable(): Promise<string[]>; // return timestamp folder names
}
