import * as vscode from 'vscode';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logInfo } from '../../utils/utils-log';
import { ICodebaseExporterServicePort } from '../../../../shared/services/codebase-exporter';
import { ExportFormat } from '../../../../shared/services/codebase-exporter/domain/model/types';

export class CodebaseExporterAdapter extends AbstractServiceAdapter implements ICodebaseExporterServicePort, vscode.Disposable {

  constructor() {
    super();
  }

    public async exportSelectedFiles(files: string[], format: ExportFormat): Promise<string> {
        // Implement the logic to export the selected files in the specified format
        const filePath = "/path/to/exported/file";
        return filePath;
    }

  public dispose() {
  }
}
