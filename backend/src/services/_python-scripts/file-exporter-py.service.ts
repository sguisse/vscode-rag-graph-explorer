import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PythonScriptStatus } from "../../../../shared/services/_python-scripts";
import { ExportArgs } from "../../../../shared/services/codebase-exporter/model/export-args";
import { pythonScriptExecutionManager } from '../../managers/PythonScriptExecution.manager';
import { ChildProcess } from 'child_process';
import { getWorkspaceExtentionPath, getWorkspaceRoot } from '../../utils/utils-vscode';
import { logInfo, logError, logWarn } from '../../utils/utils-log';

export async function callFileExporterScript(exportArgs: ExportArgs): Promise<PythonScriptStatus> {
    const rootPath = getWorkspaceRoot();
    const workspaceExtPath = getWorkspaceExtentionPath();

    const candidatePaths = [
        path.join(workspaceExtPath, 'scripts', 'codebase_exporter', 'files-exporter.py'),
        path.join(workspaceExtPath, 'scripts', 'files-exporter.py'),
        path.join(rootPath, 'scripts', 'codebase_exporter', 'files-exporter.py'),
        path.join(rootPath, 'scripts', 'files-exporter.py'),
    ];

    let pythonScriptPath = '';
    for (const candidate of candidatePaths) {
        if (fs.existsSync(candidate)) {
            pythonScriptPath = candidate;
            break;
        }
    }

    if (!pythonScriptPath) {
        const errorMsg = `[file-exporter-py] Python script NOT FOUND. Checked candidate locations:\n` + candidatePaths.map(p => ` - ${p}`).join('\n');
        logError(errorMsg);
        throw new Error(errorMsg);
    }

    logInfo(`[file-exporter-py] Resolved Python script path: ${pythonScriptPath}`);

    const absoluteSourcesArray = makePathsAbsolute(exportArgs.paths || [], rootPath);
    const absoluteDestDirectory = makeSinglePathAbsolute(exportArgs.destDir || '', rootPath);
    const concatenatedSources = absoluteSourcesArray.join(',');

    const runtimeData = {
        ...exportArgs,
        destDir: absoluteDestDirectory
    };

    const args: string[] = buildArgs(runtimeData, concatenatedSources);

    logInfo(`[file-exporter-py] Executing Python script with args: ${args.join(' ')}`);

    const childProcess: ChildProcess = await pythonScriptExecutionManager.executeScript(pythonScriptPath, args);

    if (!childProcess || !childProcess.pid) {
        const errorMsg = `[file-exporter-py] Failed to spawn child process for script: ${pythonScriptPath}`;
        logError(errorMsg);
        throw new Error(errorMsg);
    }

    logInfo(`[file-exporter-py] Successfully spawned Python process PID: ${childProcess.pid}`);

    const pythonScriptStatus = pythonScriptExecutionManager.getProcessStatus(childProcess.pid || 0);
    if (!pythonScriptStatus) {
        const errorMsg = `[file-exporter-py] Failed to retrieve status for process PID: ${childProcess.pid}`;
        logError(errorMsg);
        throw new Error(errorMsg);
    }

    return pythonScriptStatus;
}

function makePathsAbsolute(paths: string[], workspaceRoot: string): string[] {
    return paths.map(p => {
        let clean = p.replace(/^['"]|['"]$/g, '').trim();
        if (!clean) return '';
        if (!path.isAbsolute(clean)) {
            return path.join(workspaceRoot, clean);
        }
        return clean;
    }).filter(Boolean);
}

function makeSinglePathAbsolute(p: string, workspaceRoot: string): string {
    let clean = (p || '').replace(/^['"]|['"]$/g, '').trim();
    if (!clean) return workspaceRoot;
    if (!path.isAbsolute(clean)) {
        return path.join(workspaceRoot, clean);
    }
    return clean;
}

function buildArgs(exportArgs: any, sources: string): string[] {
    if (!exportArgs.destDir || exportArgs.destDir.trim() === '') {
        throw new Error('Destination directory is not specified in export arguments.');
    }

    if (!sources || sources.trim() === '') {
        throw new Error('No source paths specified for export.');
    }

    const args: string[] = ['--src', sources, '--dest', exportArgs.destDir];

    if (exportArgs.format) args.push('--format', exportArgs.format);
    if (exportArgs.mode) args.push('--mode', exportArgs.mode);
    if (exportArgs.maxFile) args.push('--max-file', String(exportArgs.maxFile));
    if (exportArgs.maxChunk) args.push('--max-chunk', String(exportArgs.maxChunk));
    if (exportArgs.groupByExt) args.push('--group-ext');
    if (exportArgs.logConsole) args.push('--log-console');
    if (exportArgs.logFile) args.push('--log-file');
    if (exportArgs.generateTreeView) args.push('--tree-view');
    if (exportArgs.timestamp) args.push('--timestamp', exportArgs.timestamp);

    const cleanFilters = (val: string) => val ? val.split(/[\n,]/).map(s => s.trim()).filter(Boolean).join(',') : '';

    if (exportArgs.incPaths) args.push('--inc-paths', cleanFilters(exportArgs.incPaths));
    if (exportArgs.excPaths) args.push('--exc-paths', cleanFilters(exportArgs.excPaths));
    if (exportArgs.incExts) args.push('--inc-ext', cleanFilters(exportArgs.incExts));
    if (exportArgs.excExts) args.push('--exc-ext', cleanFilters(exportArgs.excExts));

    return args;
}
