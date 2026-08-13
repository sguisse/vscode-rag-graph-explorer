// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { ExportFormat } from '@/shared/services/codebase-exporter/domain/model/types';
import { ICodebaseExporterServicePort } from '@/shared/services/codebase-exporter/domain/port-out/codebase-exporter-service.port';

class CodebaseExporterApiService extends AbstractApiService implements ICodebaseExporterServicePort {
    constructor() {
        super();
    }

    public async exportSelectedFiles(files: string[], format: ExportFormat, maxChunk: number, splitByExt: boolean, copyToClipboard: boolean): Promise<string> {
        return await this.rpc.call(RpcMethodEnum.CODEBASEEXPORTER_EXPORT_SELECTED_FILES, files, format, maxChunk, splitByExt, copyToClipboard);
    }

    public async readExportedFileContent(filePath: string): Promise<string> {
        return await this.rpc.call(RpcMethodEnum.CODEBASEEXPORTER_READ_EXPORTED_FILE_CONTENT, filePath);
    }

    public async storeExportedFileInClipboard(filePath: string): Promise<boolean> {
        return await this.rpc.call(RpcMethodEnum.CODEBASEEXPORTER_STORE_EXPORTED_FILE_IN_CLIPBOARD, filePath);
    }
}

export const codebaseExporterApiService = new CodebaseExporterApiService();
