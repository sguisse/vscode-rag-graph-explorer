import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logInfo, logError } from '../../utils/utils-log';
import { callErrorParserScript } from '../_python-scripts/error-parser-py.service';
import type { PythonScriptStatus } from '../../../../shared/services/_python-scripts';

import { ChildProcess } from 'child_process';
import { pythonScriptExecutionManager } from '../../managers/PythonScriptExecution.manager';
import { IBlastRadiusErrorFilesIdentificatorServicePort } from '../../../../shared/services/errors/port-out/blast-radius-error-files-identificator-service.port';
import { BlastRadiusScope } from '../../../../shared/services/errors/types/type-blast-radius-scope.gen';

export class BlastRadiusErrorFilesIdentificatorAdapter extends AbstractServiceAdapter implements IBlastRadiusErrorFilesIdentificatorServicePort, vscode.Disposable {

    constructor() {
        super();
    }

    public async searchFiles(
        scope: BlastRadiusScope,
        content: string,
        workspaceRoot: string,
        onStderr?: (data: string) => void,
        includeOutWorkspace?: boolean
    ): Promise<string[]> {
        const tmpFile = path.join(os.tmpdir(), `br-err-${scope}-${Date.now()}.txt`);
        fs.writeFileSync(tmpFile, content, 'utf8');

        try {
            logInfo(`BlastRadiusErrorFilesIdentificatorAdapter: Running error parser for scope '${scope}'`);

            const pythonScriptStatus: PythonScriptStatus = await callErrorParserScript({
                blastRadiusScope: scope,
                workspaceRoot,
                contentFilePath: tmpFile,
                includeOutWorkspace: includeOutWorkspace ?? false,
            });

            const childProcess: ChildProcess | undefined = pythonScriptExecutionManager.getProcessInstance(pythonScriptStatus.pid);
            if (!childProcess) {
                throw new Error(`Failed to get child process instance for PID ${pythonScriptStatus.pid}`);
            }

            let stdoutData = '';

            if (childProcess.stdout) {
                childProcess.stdout.on('data', (chunk: Buffer | string) => {
                    stdoutData += chunk.toString('utf-8');
                });
            }

            if (childProcess.stderr) {
                childProcess.stderr.on('data', (chunk: Buffer | string) => {
                    if (onStderr) {
                        onStderr(chunk.toString('utf-8'));
                    }
                });
            }

            await new Promise<void>((resolve, reject) => {
                childProcess.once('exit', () => resolve());
                childProcess.once('error', (err) => reject(err));
            });

            const trimmedStdout = stdoutData.trim();
            if (!trimmedStdout) {
                return [];
            }

            return JSON.parse(trimmedStdout) as string[];
        } catch (error: any) {
            logError(`BlastRadiusErrorFilesIdentificatorAdapter error parsing files: ${error?.message || error}`);
            return [];
        } finally {
            try {
                if (fs.existsSync(tmpFile)) {
                    fs.unlinkSync(tmpFile);
                }
            } catch (cleanupErr: any) {
                logError(`Failed to clean up temporary staging file ${tmpFile}: ${cleanupErr?.message || cleanupErr}`);
            }
        }
    }

    public dispose() {
        // Disposable cleanup if necessary
    }
}
