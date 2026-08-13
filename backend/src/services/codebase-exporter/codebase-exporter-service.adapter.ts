import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logInfo, logError } from '../../utils/utils-log';
import { getWorkspaceExtentionPath } from '../../utils/utils-vscode';
import { runPythonScript } from '../../utils/utils-python';
import { ICodebaseExporterServicePort } from '../../../../shared/services/codebase-exporter';
import { ExportFormat } from '../../../../shared/services/codebase-exporter/domain/model/types';
import { copyToClipboard } from '@/frontend/lib/utils';

export class CodebaseExporterAdapter extends AbstractServiceAdapter implements ICodebaseExporterServicePort, vscode.Disposable {

    constructor() {
        super();
    }

    public async exportSelectedFiles(files: string[], format: ExportFormat, maxChunk: number, splitByExt: boolean, copyToClipboard: boolean): Promise<string> {
        const destDir = path.join(
            getWorkspaceExtentionPath(),
            'tmp',
            'python',
            'exportSelectedFiles'
        );

        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        const relativeScriptPath = path.join('codebase_exporter', 'files-exporter.py');
        const scriptArgs = [
            '--mode', 'paths-export',
            '--format', format,
            '--dest', destDir,
            '--src', ...files
        ];

        try {
            logInfo(`[CodebaseExporterAdapter] Triggering export for ${files.length} file(s) into: ${destDir}`);
            await runPythonScript(relativeScriptPath, scriptArgs);

            const { exportFile, generatedFiles } = this.getLatestExportFile(destDir, format);

            const resultFilePath = exportFile
                ? path.join(destDir, exportFile)
                : path.join(destDir, generatedFiles[0] || '');

            logInfo(`[CodebaseExporterAdapter] Files exported successfully to: ${resultFilePath}`);
            return resultFilePath;

        } catch (error) {
            logError(`[CodebaseExporterAdapter] Export failed: ${error}`);
            throw error;
        }
    }

    private getLatestExportFile(destDir: string, format: ExportFormat) {
        const generatedFiles = fs.readdirSync(destDir);

        const exportFile = generatedFiles
            .filter((file) => {
                const lowerFile = file.toLowerCase();
                const hasValidExt = lowerFile.endsWith(`.${format}`);
                const isNotReportOrTree = !lowerFile.includes('-report') && !lowerFile.includes('-tree');
                return hasValidExt && isNotReportOrTree;
            })
            .sort((a, b) => {
                // Sort by latest file modification time
                const mtimeA = fs.statSync(path.join(destDir, a)).mtimeMs;
                const mtimeB = fs.statSync(path.join(destDir, b)).mtimeMs;
                return mtimeB - mtimeA;
            })[0];
        return { exportFile, generatedFiles };
    }


    public async readExportedFileContent(filePath: string): Promise<string> {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        return fs.promises.readFile(filePath, 'utf-8');
    }


    public async storeExportedFileInClipboard(filePath: string): Promise<boolean> {
        if (!fs.existsSync(filePath)) {
            logError(`[CodebaseExporterAdapter] Cannot copy to clipboard. File not found: ${filePath}`);
            return false;
        }

        const tempDir = path.join(
            getWorkspaceExtentionPath(),
            'tmp',
            'python'
        );

        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempJsonPath = path.join(tempDir, `clipboard_input_${Date.now()}.json`);

        try {
            // Write the target file path as a JSON array expected by copy-files-to-clipboard.py
            await fs.promises.writeFile(tempJsonPath, JSON.stringify([filePath]), 'utf-8');

            const relativeScriptPath = path.join('codebase_exporter', 'copy-files-to-clipboard.py');
            logInfo(`[CodebaseExporterAdapter] Copying file to clipboard via script: ${filePath}`);

            await runPythonScript(relativeScriptPath, [tempJsonPath]);
            return true;

        } catch (error) {
            logError(`[CodebaseExporterAdapter] Failed to copy file to clipboard: ${error}`);
            return false;
        } finally {
            // Clean up temporary JSON file
            if (fs.existsSync(tempJsonPath)) {
                fs.promises.unlink(tempJsonPath).catch((err) => {
                    logError(`[CodebaseExporterAdapter] Failed to clean up temp file ${tempJsonPath}: ${err}`);
                });
            }
        }
    }


    public dispose() {
    }
}
