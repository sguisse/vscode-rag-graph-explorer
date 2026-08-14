// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { ExportStatus } from '@/shared/services/codebase-exporter/domain/model/export-status';
import { ExportFormat } from '@/shared/services/codebase-exporter/domain/model/types';
import { ExportArgs } from '@/shared/services/codebase-exporter/domain/model/export-args';
import { ExportResult } from '@/shared/services/codebase-exporter/domain/model/export-result';
import { ICodebaseExporterServicePort } from '@/shared/services/codebase-exporter/domain/port-out/codebase-exporter-service.port';

class CodebaseExporterApiService extends AbstractApiService implements ICodebaseExporterServicePort {
    constructor() {
        super();
    }

    public async exportSelectedFiles(files: string[], format: ExportFormat, maxChunk: number, groupByExt: boolean): Promise<ExportStatus> {
        return await this.rpc.call(RpcMethodEnum.CODEBASEEXPORTER_EXPORT_SELECTED_FILES, files, format, maxChunk, groupByExt);
    }

    public async exportFiles(exportArgs: ExportArgs): Promise<ExportStatus> {
        return await this.rpc.call(RpcMethodEnum.CODEBASEEXPORTER_EXPORT_FILES, exportArgs);
    }

    public async getExportFilesStatus(pid: number): Promise<ExportStatus> {
        return await this.rpc.call(RpcMethodEnum.CODEBASEEXPORTER_GET_EXPORT_FILES_STATUS, pid);
    }

    public async getExportFilesResult(pid: number, exportDirectory: string, timestamp: string): Promise<ExportResult> {
        return await this.rpc.call(RpcMethodEnum.CODEBASEEXPORTER_GET_EXPORT_FILES_RESULT, pid, exportDirectory, timestamp);
    }

    public async readExportedFilesContent(pid: number, exportResult: ExportResult): Promise<string> {
        return await this.rpc.call(RpcMethodEnum.CODEBASEEXPORTER_READ_EXPORTED_FILES_CONTENT, pid, exportResult);
    }

    public async storeExportedFilesInClipboard(pid: number, exportResult: ExportResult): Promise<boolean> {
        return await this.rpc.call(RpcMethodEnum.CODEBASEEXPORTER_STORE_EXPORTED_FILES_IN_CLIPBOARD, pid, exportResult);
    }
}

export const codebaseExporterApiService = new CodebaseExporterApiService();
