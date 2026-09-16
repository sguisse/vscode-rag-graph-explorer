import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import {
  AssessmentsPyReport,
  AssessmentsPyResult,
} from '../../../../shared/services/maturity-matrix/index.js';
import { getWorkspaceExtentionPath, getWorkspaceRoot } from '../../utils/utils-vscode.js';

const execAsync = promisify(exec);

export class MaturityMatrixPyService {
  private readonly scriptPath: string;

  constructor(customScriptPath?: string) {
    this.scriptPath = customScriptPath || this.resolveScriptPath();
  }

  private resolveScriptPath(): string {
    const rootPath = getWorkspaceRoot();
    const workspaceExtPath = getWorkspaceExtentionPath();

    const candidatePaths = [
      path.join(workspaceExtPath, '.token-razor', 'scripts', 'architecture', 'maturity-matrix', 'maturity_matrix.py'),
      path.join(workspaceExtPath, 'scripts', 'architecture', 'maturity-matrix', 'maturity_matrix.py'),
      path.join(rootPath, '.token-razor', 'scripts', 'architecture', 'maturity-matrix', 'maturity_matrix.py'),
      path.join(rootPath, 'scripts', 'architecture', 'maturity-matrix', 'maturity_matrix.py'),
      path.resolve(process.cwd(), '.token-razor/scripts/architecture/maturity-matrix/maturity_matrix.py'),
      path.resolve(process.cwd(), 'scripts/architecture/maturity-matrix/maturity_matrix.py'),
    ];

    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return path.resolve(process.cwd(), '.token-razor/scripts/architecture/maturity-matrix/maturity_matrix.py');
  }

  private async runPythonAction(action: string, extraArgs: string = ''): Promise<string> {
    const command = `python3 "${this.scriptPath}" --action ${action} ${extraArgs}`.trim();
    const { stdout, stderr } = await execAsync(command, {
      env: {
        ...process.env,
        PYTHONPATH: `${process.cwd()}:${process.env.PYTHONPATH || ''}`,
      },
      maxBuffer: 50 * 1024 * 1024,
    });

    if (stderr && stderr.trim().length > 0) {
      console.warn(`[MaturityMatrixPyService] Python stderr: ${stderr}`);
    }

    return stdout.trim();
  }

  async refreshAssessments(): Promise<AssessmentsPyReport> {
    const rawOutput = await this.runPythonAction('refresh-assessments');
    return JSON.parse(rawOutput) as AssessmentsPyReport;
  }

  async getLastAssessments(): Promise<AssessmentsPyResult> {
    const rawOutput = await this.runPythonAction('get-last-assessments');
    return JSON.parse(rawOutput) as AssessmentsPyResult;
  }

  async getAssessmentsAt(datetimeExtract: string): Promise<AssessmentsPyResult> {
    const rawOutput = await this.runPythonAction('get-assessments-at', `--assessment-datetime "${datetimeExtract}"`);
    return JSON.parse(rawOutput) as AssessmentsPyResult;
  }

  async getAssessmentsAvailable(): Promise<string[]> {
    const rawOutput = await this.runPythonAction('get-assessments-available');
    return JSON.parse(rawOutput) as string[];
  }
}
