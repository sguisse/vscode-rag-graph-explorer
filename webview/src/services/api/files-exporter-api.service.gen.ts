// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { FilesExporterInitialState, FilesExporterRunRequest, FilesExporterRunResponse, FilesExporterStatus, FilesExporterResult, FilterSimulationRequest, FilterSimulationResult, GeneratedFilesFilterRequest, GeneratedFilesFilterResult, DestinationActionResult, ClipboardActionResult, FilesExporterNotificationType } from '@/shared/services/file-exporter/model/file-exporter-model';
import { IFilesExporterServicePort } from '@/shared/services/file-exporter/port-out/file-exporter-service.port';

class FilesExporterApiService extends AbstractApiService implements IFilesExporterServicePort {
    constructor() {
        super();
    }

    public async getInitialState(pendingPaths?: string[]): Promise<FilesExporterInitialState> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_GET_INITIAL_STATE, pendingPaths);
    }

    public async runExport(request: FilesExporterRunRequest): Promise<FilesExporterRunResponse> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_RUN_EXPORT, request);
    }

    public async getExportStatus(pid: number): Promise<FilesExporterStatus> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_GET_EXPORT_STATUS, pid);
    }

    public async getExportResult(pid: number, exportDirectory: string, timestamp: string): Promise<FilesExporterResult> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_GET_EXPORT_RESULT, pid, exportDirectory, timestamp);
    }

    public async killExport(pid: number): Promise<boolean> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_KILL_EXPORT, pid);
    }

    public async simulateFilters(request: FilterSimulationRequest): Promise<FilterSimulationResult> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_SIMULATE_FILTERS, request);
    }

    public async getOpenEditorFiles(currentPaths: string[]): Promise<string[]> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_GET_OPEN_EDITOR_FILES, currentPaths);
    }

    public async getGitDiffFiles(currentPaths: string[]): Promise<string[]> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_GET_GIT_DIFF_FILES, currentPaths);
    }

    public async syncSelectedPaths(paths: string[]): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_SYNC_SELECTED_PATHS, paths);
    }

    public async getSelectedPaths(): Promise<string[]> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_GET_SELECTED_PATHS);
    }

    public async clearSelectedPaths(): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_CLEAR_SELECTED_PATHS);
    }

    public async openPathAtCursor(path: string, lineNum?: number): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_OPEN_PATH_AT_CURSOR, path, lineNum);
    }

    public async copyLatestExportedFiles(destDir: string): Promise<DestinationActionResult> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_COPY_LATEST_EXPORTED_FILES, destDir);
    }

    public async copySelectedFilesToClipboard(paths: string[]): Promise<ClipboardActionResult> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_COPY_SELECTED_FILES_TO_CLIPBOARD, paths);
    }

    public async clearDestDirectory(destDir: string): Promise<DestinationActionResult> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_CLEAR_DEST_DIRECTORY, destDir);
    }

    public async applyFileFilter(request: GeneratedFilesFilterRequest): Promise<GeneratedFilesFilterResult> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_APPLY_FILE_FILTER, request);
    }

    public async openBrowserTab(url: string, openInVSCode?: boolean): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_OPEN_BROWSER_TAB, url, openInVSCode);
    }

    public async showNotification(type: FilesExporterNotificationType, text: string): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.FILEEXPORTER_SHOW_NOTIFICATION, type, text);
    }
}

export const filesExporterApiService = new FilesExporterApiService();
