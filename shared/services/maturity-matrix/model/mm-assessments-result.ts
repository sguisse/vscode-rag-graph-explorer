export interface MMAssessmentsResult {
  assessmentDatetime: string;
  targetDirectory: string;
  reportPath: string;
  csvExtractPath: string;
  rows: string[][];  // the content of file csvExtractPath
}
