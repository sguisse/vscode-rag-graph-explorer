import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { PythonScriptStatus } from "../../../../shared/services/_python-scripts";
import { pythonScriptExecutionManager } from '../../managers/PythonScriptExecution.manager';
import { ChildProcess } from 'child_process';
import { getWorkspaceExtentionPath } from '../../utils/utils-vscode';

const PYTHON_SCRIPT_PATH = path.join(getWorkspaceExtentionPath(), 'scripts', 'codebase_exporter', 'copy-files-to-clipboard.py');

export async function callCopyFilesToClipboardScript(files: string[]): Promise<PythonScriptStatus> {
    if (!files || files.length === 0) {
        throw new Error('No files provided to copy to clipboard.');
    }

    // Create a temporary JSON file to pass file paths safely to the Python script
    const tmpFilePath = path.join(os.tmpdir(), `copy-files-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.json`);
    await fs.promises.writeFile(tmpFilePath, JSON.stringify(files), 'utf-8');

    const args: string[] = [tmpFilePath];

    // Execute via pythonScriptExecutionManager
    const childProcess: ChildProcess = await pythonScriptExecutionManager.executeScript(PYTHON_SCRIPT_PATH, args);

    // Clean up temporary JSON file when process exits
    childProcess.once('exit', () => {
        fs.promises.unlink(tmpFilePath).catch(() => {});
    });

    const pythonScriptStatus = pythonScriptExecutionManager.getProcessStatus(childProcess.pid || 0);
    if (!pythonScriptStatus) {
        throw new Error(`Failed to retrieve status for the Python script process with PID: ${childProcess.pid}`);
    }

    return pythonScriptStatus;
}
