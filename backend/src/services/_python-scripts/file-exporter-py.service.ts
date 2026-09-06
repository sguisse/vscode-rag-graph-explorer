import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PythonScriptStatus } from "../../../../shared/services/_python-scripts";
import { pythonScriptExecutionManager } from '../../managers/PythonScriptExecution.manager';
import { ChildProcess } from 'child_process';
import { getWorkspaceExtentionPath, getWorkspaceRoot } from '../../utils/utils-vscode';
import { logInfo, logError } from '../../utils/utils-log';

export async function callFileExporterScript(exportArgs: any): Promise<PythonScriptStatus> {
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

    const absoluteCodebaseArray = makePathsAbsolute(exportArgs.paths || [], rootPath);
    const absoluteReferenceArray = makePathsAbsolute(exportArgs.referencePaths || [], rootPath);
    const absoluteDestDirectory = makeSinglePathAbsolute(exportArgs.destDir || '', rootPath);

    const runtimeData = {
        ...exportArgs,
        destDir: absoluteDestDirectory
    };

    const args: string[] = buildArgs(runtimeData, absoluteCodebaseArray.join(','), absoluteReferenceArray.join(','));

    logInfo(`[file-exporter-py] Executing Python script with args: ${args.join(' ')}`);

    const childProcess: ChildProcess = await pythonScriptExecutionManager.executeScript(pythonScriptPath, args);

    if (!childProcess || !childProcess.pid) {
        const errorMsg = `[file-exporter-py] Failed to spawn child process for script: ${pythonScriptPath}`;
        logError(errorMsg);
        throw new Error(errorMsg);
    }

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
        let clean = (p || '').replace(/^['"]|['"]$/g, '').trim();
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

function buildArgs(exportArgs: any, codebaseSources: string, referenceSources: string): string[] {
    if (!exportArgs.destDir || exportArgs.destDir.trim() === '') {
        throw new Error('Destination directory is not specified in export arguments.');
    }

    const args: string[] = ['--dest', exportArgs.destDir];

    if (codebaseSources) {
        args.push('--codebase-src', codebaseSources);
    }
    if (referenceSources) {
        args.push('--reference-src', referenceSources);
    }
    if (exportArgs.prompt) {
        args.push('--prompt', exportArgs.prompt);
    }

    if (exportArgs.format) args.push('--format', exportArgs.format);
    if (exportArgs.mode) args.push('--mode', exportArgs.mode);
    if (exportArgs.maxChunk) args.push('--max-chunk', String(exportArgs.maxChunk));
    if (exportArgs.groupByExt) args.push('--group-ext');
    if (exportArgs.logConsole) args.push('--log-console');
    if (exportArgs.logFile) args.push('--log-file');
    if (exportArgs.generateTreeView) args.push('--tree-view');
    if (exportArgs.timestamp) args.push('--timestamp', exportArgs.timestamp);

    const cleanFilters = (val: string) => val ? val.split(/[\n,]/).map(s => s.trim()).filter(Boolean).join(',') : '';

    const codebase = exportArgs.config?.codebase || exportArgs.codebase || {};
    const reference = exportArgs.config?.reference || exportArgs.reference || {};

    // Codebase filters
    if (codebase.inc_paths || exportArgs.codebaseIncPaths) args.push('--codebase-inc-paths', cleanFilters(codebase.inc_paths || exportArgs.codebaseIncPaths));
    if (codebase.exc_paths || exportArgs.codebaseExcPaths) args.push('--codebase-exc-paths', cleanFilters(codebase.exc_paths || exportArgs.codebaseExcPaths));
    if (codebase.inc_ext || exportArgs.codebaseIncExts) args.push('--codebase-inc-ext', cleanFilters(codebase.inc_ext || exportArgs.codebaseIncExts));
    if (codebase.exc_ext || exportArgs.codebaseExcExts) args.push('--codebase-exc-ext', cleanFilters(codebase.exc_ext || exportArgs.codebaseExcExts));
    if (codebase.max_file || exportArgs.codebaseMaxFile) args.push('--codebase-max-file', String(codebase.max_file || exportArgs.codebaseMaxFile));

    // Reference filters
    if (reference.inc_paths || exportArgs.referenceIncPaths) args.push('--reference-inc-paths', cleanFilters(reference.inc_paths || exportArgs.referenceIncPaths));
    if (reference.exc_paths || exportArgs.referenceExcPaths) args.push('--reference-exc-paths', cleanFilters(reference.exc_paths || exportArgs.referenceExcPaths));
    if (reference.inc_ext || exportArgs.referenceIncExts) args.push('--reference-inc-ext', cleanFilters(reference.inc_ext || exportArgs.referenceIncExts));
    if (reference.exc_ext || exportArgs.referenceExcExts) args.push('--reference-exc-ext', cleanFilters(reference.exc_ext || exportArgs.referenceExcExts));
    if (reference.max_file || exportArgs.referenceMaxFile) args.push('--reference-max-file', String(reference.max_file || exportArgs.referenceMaxFile));

    return args;
}
