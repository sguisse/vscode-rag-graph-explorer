import * as fs from 'fs';
import * as path from 'path';
import { ChildProcess } from 'child_process';
import { PythonScriptStatus } from '../../../../shared/services/_python-scripts';
import { pythonScriptExecutionManager } from '../../managers/PythonScriptExecution.manager';
import { logError, logInfo } from '../../utils/utils-log';
import { getWorkspaceExtentionPath, getWorkspaceRoot } from '../../utils/utils-vscode';

export type MaturityMatrixAction = 'update-repo' | 'extract-assessments' | 'extract-maturity-matrix' | 'all';

export async function callMaturityMatrixScript(repoPath: string, action: MaturityMatrixAction = 'all'): Promise<PythonScriptStatus> {
    const rootPath = getWorkspaceRoot();
    const workspaceExtPath = getWorkspaceExtentionPath();

    const candidatePaths = [
        path.join(workspaceExtPath, 'scripts', 'maturity-matrix', 'maturity_matrix.py'),
        path.join(rootPath, 'scripts', 'maturity-matrix', 'maturity_matrix.py'),
        path.join(workspaceExtPath, 'scripts', 'maturity_matrix.py'),
        path.join(rootPath, 'scripts', 'maturity_matrix.py'),
    ];

    let pythonScriptPath = '';
    for (const candidate of candidatePaths) {
        if (fs.existsSync(candidate)) {
            pythonScriptPath = candidate;
            break;
        }
    }

    if (!pythonScriptPath) {
        const errorMsg = `[maturity-matrix-py] Python script NOT FOUND. Checked candidate locations:\n` + candidatePaths.map((p) => ` - ${p}`).join('\n');
        logError(errorMsg);
        throw new Error(errorMsg);
    }

    const normalizedRepoPath = repoPath && repoPath.trim() ? repoPath.trim() : rootPath;
    const args: string[] = ['--repo-path', normalizedRepoPath, '--action', action];

    logInfo(`[maturity-matrix-py] Executing Python script with args: ${args.join(' ')}`);

    const childProcess: ChildProcess = await pythonScriptExecutionManager.executeScript(pythonScriptPath, args);

    if (!childProcess || !childProcess.pid) {
        const errorMsg = `[maturity-matrix-py] Failed to spawn child process for script: ${pythonScriptPath}`;
        logError(errorMsg);
        throw new Error(errorMsg);
    }

    const pythonScriptStatus = pythonScriptExecutionManager.getProcessStatus(childProcess.pid || 0);
    if (!pythonScriptStatus) {
        const errorMsg = `[maturity-matrix-py] Failed to retrieve status for process PID: ${childProcess.pid}`;
        logError(errorMsg);
        throw new Error(errorMsg);
    }

    return pythonScriptStatus;
}
