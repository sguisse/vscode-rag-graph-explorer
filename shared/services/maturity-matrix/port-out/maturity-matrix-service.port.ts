import type { MMAssessmentsReport, MMAssessmentsResult } from '../model/index';

export interface IMaturityMatrixServicePort {
  refreshAssessments(): Promise<MMAssessmentsReport>;
  getLastAssessments(): Promise<MMAssessmentsResult>;
  getAssessmentsAt(assessmentDatetime: string): Promise<MMAssessmentsResult>;
  getAssessmentsAvailable(): Promise<string[]>; // return timestamp folder names
}
