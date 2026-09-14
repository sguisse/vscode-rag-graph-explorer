export interface MMAssessmentsReport {
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
