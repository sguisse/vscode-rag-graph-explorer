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
import { ICodebaseExporterServicePort, ExportStatus } from '../../../../shared/services/codebase-exporter';
import { callFileExporterScript } from '../_python-scripts/file-exporter-py.service';


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
        const exportDirectory = this.buildExportDirectory(exportArgs);
        const pythonScriptStatus: PythonScriptStatus = await callFileExporterScript(exportArgs);

        const exportStatus: ExportStatus = {
            exportDir: exportDirectory,
            pythonScriptStatus: pythonScriptStatus,
        };

        return exportStatus;
    }



    readExportedFileContent(filePath: string): Promise<string> {
        throw new Error('Method not implemented.');
    }
    storeExportedFileInClipboard(filePath: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }

    public dispose() {
    }
}
