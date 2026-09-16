export interface AssessmentsPyReport {
  datetimeExtract: string;
  targetDirectory: string;
  files: {
    jsonExtract: string;
    csvExtract: string;
    skillsCsvExtract: string;
  };
  reportPath: string;
  status: string;
  message: string;
}


export interface AssessmentsPyResult {
  datetimeExtract: string;
  targetDirectory: string;
  reportPath: string;
  csvExtractPath: string;
  rows: string[][];  // the content of file csvExtractPath
}
