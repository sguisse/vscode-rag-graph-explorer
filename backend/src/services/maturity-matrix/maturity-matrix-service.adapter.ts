import * as vscode from 'vscode';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logInfo } from '../../utils/utils-log';
import { getWorkspaceRoot } from '../../utils/utils-vscode';
import { PythonScriptStatus } from '../../../../shared/services/_python-scripts';
import { IMaturityMatrixServicePort, MaturityMatrixResult } from '../../../../shared/services/maturity-matrix';
import { callMaturityMatrixScript } from '../_python-scripts/maturity-matrix-py.service';

export class MaturityMatrixAdapter extends AbstractServiceAdapter implements IMaturityMatrixServicePort, vscode.Disposable {
    constructor() {
        super();
    }

    private async runRepoUpdate(): Promise<PythonScriptStatus> {
        const repoPath = getWorkspaceRoot();
        return await callMaturityMatrixScript(repoPath, 'update-repo');
    }

    private async runScriptAction(action: 'extract-assessments' | 'extract-maturity-matrix'): Promise<PythonScriptStatus> {
        const repoPath = getWorkspaceRoot();
        await this.runRepoUpdate();
        return await callMaturityMatrixScript(repoPath, action);
    }

    private buildPlaceholderResult(label: string): MaturityMatrixResult {
        const createdAt = new Date().toISOString();
        return {
            label,
            generatedAt: createdAt,
            message: 'not yet implemtned',
            rows: [
                ['status', 'message'],
                ['not yet implemtned', 'not yet implemtned'],
            ],
        };
    }

    public async extractAssessments(): Promise<MaturityMatrixResult> {
        await this.runScriptAction('extract-assessments');
        const result = this.buildPlaceholderResult('Assessments');
        logInfo(`[maturity-matrix] ${result.label} extraction completed: ${result.message}`);
        return result;
    }

    public async extractMaturityMatrix(): Promise<MaturityMatrixResult> {
        await this.runScriptAction('extract-maturity-matrix');
        const result = this.buildPlaceholderResult('Maturity Matrix');
        logInfo(`[maturity-matrix] ${result.label} extraction completed: ${result.message}`);
        return result;
    }

    public dispose() {
        // Reserved for future cleanup.
    }
}
