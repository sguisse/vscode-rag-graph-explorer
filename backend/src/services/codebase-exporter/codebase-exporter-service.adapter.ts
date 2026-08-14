import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logInfo, logError } from '../../utils/utils-log';
import { getWorkspaceExtentionPath } from '../../utils/utils-vscode';
import { runPythonScript } from '../../utils/utils-python';
import { ExportFormat } from '../../../../shared/services/codebase-exporter/domain/model/types';
import { ExportArgs } from '../../../../shared/services/codebase-exporter/domain/model/export-args';
import { getFormattedTimestamp } from '../../utils/utils-datetime';
import { PythonScriptStatus } from '../../../../shared/services/_python-scripts';
import { ICodebaseExporterServicePort, ExportStatus, ExportResult, ExportReport } from '../../../../shared/services/codebase-exporter';
import { callFileExporterScript } from '../_python-scripts/file-exporter-py.service';
import { pythonScriptExecutionManager } from '../../managers/PythonScriptExecution.manager';


export class CodebaseExporterAdapter extends AbstractServiceAdapter implements ICodebaseExporterServicePort, vscode.Disposable {

    constructor() {
        super();
    }

    private buildExportDirectory(exportArgs: ExportArgs): string {
        if (!exportArgs.timestamp || exportArgs.timestamp.trim() === '') {
            exportArgs.timestamp = getFormattedTimestamp();
        }

        const datetimeFolderName: string = exportArgs.timestamp;
        let exportDirectory = exportArgs.destDir;

        if (!exportDirectory || exportDirectory.trim() === '') {
            exportDirectory = getWorkspaceExtentionPath();
        }

        exportDirectory = path.join(exportDirectory, 'tmp', 'python', 'export-files', datetimeFolderName);

        if (!fs.existsSync(exportDirectory)) {
            fs.mkdirSync(exportDirectory, { recursive: true });
        }

        // ⚠️ Update the exportArgs.destDir to the newly created exportDirectory
        exportArgs.destDir = exportDirectory;

        return exportDirectory;
    }

    public async exportSelectedFiles(files: string[], format: ExportFormat, maxChunk: number, groupByExt: boolean): Promise<ExportStatus> {
        const exportArgs: ExportArgs = {
            paths: files,
            timestamp: getFormattedTimestamp(),
            mode: 'paths-export',
            format: format,
            maxChunk: maxChunk,
            groupByExt: groupByExt
        };

        return await this.exportFiles(exportArgs);
    }


    public async exportFiles (exportArgs: ExportArgs): Promise<ExportStatus> {
        this.buildExportDirectory(exportArgs);
        const pythonScriptStatus: PythonScriptStatus = await callFileExporterScript(exportArgs);

        const exportStatus: ExportStatus = {
            pythonScriptStatus: pythonScriptStatus,
        };

        return exportStatus;
    }


    public async checkExportFilesStatus (pid: number): Promise<ExportStatus> {
        const status = pythonScriptExecutionManager.getProcessStatus(pid || 0);
        if (status) {
            const exportStatus: ExportStatus = {
                pythonScriptStatus: status,
            };
            return exportStatus;
        } else {
            throw new Error(`Process with PID ${pid} does not exist.`);
        }
    }

    public async getExportFilesResult (pid: number, exportArgs: ExportArgs): Promise<ExportResult> {
        this.checkProcessIsFinished(pid);

        const exportResult: ExportResult = {
            pid: pid,
            report: this.readExportReportFromFile(exportArgs.destDir || '', exportArgs.timestamp || '')
        };
        return exportResult;
    }


    private checkProcessIsFinished(pid: number) {
        const status = pythonScriptExecutionManager.getProcessStatus(pid || 0);
        if (!status) {
            throw new Error(`Process with PID ${pid} does not exist.`);
        }
        if (!status.isRunning) {
            throw new Error(`Process with PID ${pid} is still running.`);
        }
    }

    private readExportReportFromFile(exportDirectory: string, timestamp: string): ExportReport {
        // Find file contain ends with report.json
        const reportFilePath = path.join(exportDirectory, `export-${timestamp}-report.json`);
        if (!fs.existsSync(reportFilePath)) {
            throw new Error(`Report file not found at path: ${reportFilePath}`);
        }

        const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
        const report: ExportReport = JSON.parse(reportContent);
        return report;
    }


    public async readExportedFilesContent(pid: number, exportArgs: ExportArgs): Promise<string> {
        this.checkProcessIsFinished(pid);

        // Concat all exported files in the export directory into a single string
        // Excluded filesname contains ['report', 'log', 'tree'] in their names
        const exportDirectory = exportArgs.destDir || '';
        if (!fs.existsSync(exportDirectory)) {
            throw new Error(`Export directory does not exist: ${exportDirectory}`);
        }

        const files = fs.readdirSync(exportDirectory);
        const exportedFiles = files.filter(file => {
            return !file.includes('-report') && !file.includes('-log') && !file.includes('-tree');
        });
        logInfo(`Read ${exportedFiles.length} exported files / ${files.length} generated files in the export directory: '${exportDirectory}''`);

        let content = '';
        for (const file of exportedFiles) {
            const filePath = path.join(exportDirectory, file);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            content += `\n\n--- Content of ${file} ---\n\n`;
            content += fileContent;
        }

        return content;
    }

    public async storeExportedFilesInClipboard(pid: number, exportArgs: ExportArgs): Promise<boolean> {
        this.checkProcessIsFinished(pid);



        throw new Error('Method not implemented.');
    }

    public dispose() {
    }
}
