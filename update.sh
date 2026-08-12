import * as path from 'path';
import * as fs from 'fs';
import { pythonScriptExecutionManager } from '../managers/PythonScriptExecution.manager';
import { getWorkspaceExtentionPath } from './utils-vscode';
import { logInfo, logError } from './utils-log';

export interface PythonExecutionResult {
    stdout: string;
    stderr: string;
    code: number | null;
}

/**
 * Executes a Python script located inside the workspace scripts folder.
 *
 * @param relativeScriptPath Path relative to the 'scripts' directory (e.g. 'codebase_exporter/files-exporter.py')
 * @param args Array of command-line arguments to pass to the script.
 * @param options Additional SpawnOptions for child_process.
 */
export function runPythonScript(
    relativeScriptPath: string,
    args: string[] = [],
    options: any = {}
): Promise<PythonExecutionResult> {
    return new Promise((resolve, reject) => {
        const workspaceExtensionPath = getWorkspaceExtentionPath();
        const scriptPath = path.join(workspaceExtensionPath, 'scripts', relativeScriptPath);

        if (!fs.existsSync(scriptPath)) {
            const errorMsg = `[utils-python] Python script not found at path: ${scriptPath}`;
            logError(errorMsg);
            return reject(new Error(errorMsg));
        }

        logInfo(`[utils-python] Executing Python script: ${scriptPath} with args: ${args.join(' ')}`);

        const child = pythonScriptExecutionManager.executeScript(scriptPath, args, options);

        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', (data: any) => {
            stdout += data.toString();
        });

        child.stderr?.on('data', (data: any) => {
            stderr += data.toString();
        });

        child.on('close', (code: number | null) => {
            if (code === 0) {
                logInfo(`[utils-python] Script '${relativeScriptPath}' finished successfully.`);
                resolve({ stdout, stderr, code });
            } else {
                const errorMsg = `[utils-python] Script '${relativeScriptPath}' failed with exit code ${code}.\nStderr: ${stderr}`;
                logError(errorMsg);
                reject(new Error(errorMsg));
            }
        });

        child.on('error', (err: Error) => {
            logError(`[utils-python] Failed to launch process for '${relativeScriptPath}': ${err.message}`, err);
            reject(err);
        });
    });
}
