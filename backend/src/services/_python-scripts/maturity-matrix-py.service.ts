import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';
import {
  IMaturityMatrixServicePort,
  MMAssessmentsReport,
  MMAssessmentsResult,
} from '../../../../shared/services/maturity-matrix/index.js';

const execAsync = promisify(exec);

export class MaturityMatrixPyService implements IMaturityMatrixServicePort {
  private readonly scriptPath: string;

  constructor(customScriptPath?: string) {
    this.scriptPath = customScriptPath || path.resolve(
      process.cwd(),
      'scripts/architecture/maturity-matrix/maturity_matrix.py'
    );
  }

  private async runPythonAction(action: string, extraArgs: string = ''): Promise<string> {
    const command = `python3 "${this.scriptPath}" --action ${action} ${extraArgs}`.trim();
    const { stdout, stderr } = await execAsync(command, {
      env: {
        ...process.env,
        PYTHONPATH: `${process.cwd()}:${process.env.PYTHONPATH || ''}`,
      },
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer to handle large CSV outputs
    });

    if (stderr && stderr.trim().length > 0) {
      console.warn(`[MaturityMatrixPyService] Python stderr: ${stderr}`);
    }

    return stdout.trim();
  }

  async refreshAssessments(): Promise<MMAssessmentsReport> {
    const rawOutput = await this.runPythonAction('refresh-assessments');
    return JSON.parse(rawOutput) as MMAssessmentsReport;
  }

  async getLastAssessments(): Promise<MMAssessmentsResult> {
    const rawOutput = await this.runPythonAction('get-last-assessments');
    return JSON.parse(rawOutput) as MMAssessmentsResult;
  }

  async getAssessmentsAt(assessmentDatetime: string): Promise<MMAssessmentsResult> {
    const rawOutput = await this.runPythonAction('get-assessments-at', `--assessment-datetime "${assessmentDatetime}"`);
    return JSON.parse(rawOutput) as MMAssessmentsResult;
  }

  async getAssessmentsAvailable(): Promise<string[]> {
    const rawOutput = await this.runPythonAction('get-assessments-available');
    return JSON.parse(rawOutput) as string[];
  }
}
