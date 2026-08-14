import * as vscode from 'vscode';
import * as path from 'path';
import { PythonScriptStatus } from "../../../../shared/services/_python-scripts";
import { ExportArgs } from "../../../../shared/services/codebase-exporter/domain/model/export-args";
import { pythonScriptExecutionManager } from '../../managers/PythonScriptExecution.manager';
import { ChildProcess } from 'child_process';
import { getWorkspaceExtentionPath, getWorkspaceRoot } from '../../utils/utils-vscode';
import { ExportResult } from '../../../../shared/services/codebase-exporter';

const PYTHON_SCRIPT_PATH = path.join(getWorkspaceExtentionPath(), 'scripts', 'codebase_exporter', 'copy-files-to-clipboard.py');

export async function callCopyFilesToClipboardScript(files: string[], timeoutMs: number): Promise<PythonScriptStatus> {


}
