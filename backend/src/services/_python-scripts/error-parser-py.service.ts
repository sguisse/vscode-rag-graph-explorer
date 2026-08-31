import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { PythonScriptStatus } from "../../../../shared/services/_python-scripts";
import { pythonScriptExecutionManager } from '../../managers/PythonScriptExecution.manager';
import { ChildProcess } from 'child_process';
import { getWorkspaceExtentionPath } from '../../utils/utils-vscode';

const PYTHON_SCRIPT_PATH = path.join(getWorkspaceExtentionPath(), 'scripts', 'codebase_exporter', 'error-parser.py');

export interface ErrorParserArgs {
    blastRadiusScope: string;
    workspaceRoot: string;
    contentFilePath: string;
    includeOutWorkspace?: boolean;
}

export async function callErrorParserScript(parserArgs: ErrorParserArgs): Promise<PythonScriptStatus> {
    if (!parserArgs.blastRadiusScope || parserArgs.blastRadiusScope.trim() === '') {
        throw new Error('Blast radius scope is not specified.');
    }

    if (!parserArgs.workspaceRoot || parserArgs.workspaceRoot.trim() === '') {
        throw new Error('Workspace root path is not specified.');
    }

    if (!parserArgs.contentFilePath || parserArgs.contentFilePath.trim() === '') {
        throw new Error('Content file path is not specified for error parsing.');
    }

    const args: string[] = [
        parserArgs.blastRadiusScope.trim(),
        parserArgs.workspaceRoot.trim(),
        parserArgs.contentFilePath.trim(),
        parserArgs.includeOutWorkspace !== undefined ? (parserArgs.includeOutWorkspace ? 'true' : 'false') : 'false'
    ];

    // Execute via pythonScriptExecutionManager
    const childProcess: ChildProcess = await pythonScriptExecutionManager.executeScript(PYTHON_SCRIPT_PATH, args);

    const pythonScriptStatus = pythonScriptExecutionManager.getProcessStatus(childProcess.pid || 0);
    if (!pythonScriptStatus) {
        throw new Error(`Failed to retrieve status for the Python script process with PID: ${childProcess.pid}`);
    }

    return pythonScriptStatus;
}
