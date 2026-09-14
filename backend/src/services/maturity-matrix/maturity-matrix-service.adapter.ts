import * as vscode from 'vscode';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter.js';
import { logInfo } from '../../utils/utils-log.js';
import {
  IMaturityMatrixServicePort,
  MMAssessmentsReport,
  MMAssessmentsResult,
} from '../../../../shared/services/maturity-matrix/index.js';
import { MaturityMatrixPyService } from '../_python-scripts/maturity-matrix-py.service.js';

export class MaturityMatrixAdapter extends AbstractServiceAdapter implements IMaturityMatrixServicePort, vscode.Disposable {
  private readonly pyService: MaturityMatrixPyService;

  constructor() {
    super();
    this.pyService = new MaturityMatrixPyService();
  }

  public async refreshAssessments(): Promise<MMAssessmentsReport> {
    logInfo('[maturity-matrix] Refreshing assessments...');
    const result = await this.pyService.refreshAssessments();
    logInfo(`[maturity-matrix] Refresh completed. Report path: ${result.reportPath}`);
    return result;
  }

  public async getLastAssessments(): Promise<MMAssessmentsResult> {
    logInfo('[maturity-matrix] Fetching last assessments...');
    const result = await this.pyService.getLastAssessments();
    logInfo(`[maturity-matrix] Fetched last assessments at: ${result.datetimeExtract}`);
    return result;
  }

  public async getAssessmentsAt(datetimeExtract: string): Promise<MMAssessmentsResult> {
    logInfo(`[maturity-matrix] Fetching assessments at datetimeExtract: ${datetimeExtract}...`);
    const result = await this.pyService.getAssessmentsAt(datetimeExtract);
    logInfo(`[maturity-matrix] Fetched assessments snapshot at: ${result.datetimeExtract}`);
    return result;
  }

  public async getAssessmentsAvailable(): Promise<string[]> {
    logInfo('[maturity-matrix] Fetching available assessment timestamps...');
    const timestamps = await this.pyService.getAssessmentsAvailable();
    logInfo(`[maturity-matrix] Found ${timestamps.length} available assessment snapshot(s).`);
    return timestamps;
  }

  public dispose() {
    // Reserved for future cleanup.
  }
}
