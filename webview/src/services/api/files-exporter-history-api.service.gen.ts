// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { HistoryWrapper, HistoryEntry, HistoryViewMode, ExportConfig, HistorySaveResult, HistoryClearRequest, HistoryClearResult } from '@/shared/services/file-exporter/model/file-exporter-model';
import { IFilesExporterHistoryServicePort } from '@/shared/services/file-exporter/port-out/fe-history-service.port';

class FilesExporterHistoryApiService extends AbstractApiService implements IFilesExporterHistoryServicePort {
    constructor() {
        super();
    }

    public async getFullWrapper(currentRepo?: string): Promise<HistoryWrapper> {
        return await this.rpc.call(RpcMethodEnum.FEHISTORY_GET_FULL_WRAPPER, currentRepo);
    }

    public async loadHistory(): Promise<HistoryEntry[]> {
        return await this.rpc.call(RpcMethodEnum.FEHISTORY_LOAD_HISTORY);
    }

    public async getLastRunConfigId(repo: string): Promise<string> {
        return await this.rpc.call(RpcMethodEnum.FEHISTORY_GET_LAST_RUN_CONFIG_ID, repo);
    }

    public async setHistoryViewMode(mode: HistoryViewMode, repo: string): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.FEHISTORY_SET_HISTORY_VIEW_MODE, mode, repo);
    }

    public async saveHistory(formData: ExportConfig, currentHistoryId: string | undefined, repo: string): Promise<HistorySaveResult> {
        return await this.rpc.call(RpcMethodEnum.FEHISTORY_SAVE_HISTORY, formData, currentHistoryId, repo);
    }

    public async duplicateEntry(id: string, repo: string): Promise<{ history: HistoryEntry[]; newId: string }> {
        return await this.rpc.call(RpcMethodEnum.FEHISTORY_DUPLICATE_ENTRY, id, repo);
    }

    public async addNewEntry(defaultConfig: ExportConfig, workspaceName: string, repo: string, customName?: string): Promise<{ history: HistoryEntry[]; newId: string }> {
        return await this.rpc.call(RpcMethodEnum.FEHISTORY_ADD_NEW_ENTRY, defaultConfig, workspaceName, repo, customName);
    }

    public async toggleFreeze(id: string, isFrozen: boolean): Promise<HistoryEntry[]> {
        return await this.rpc.call(RpcMethodEnum.FEHISTORY_TOGGLE_FREEZE, id, isFrozen);
    }

    public async updateEntryDisplay(id: string, newDisplay: string): Promise<HistoryEntry[]> {
        return await this.rpc.call(RpcMethodEnum.FEHISTORY_UPDATE_ENTRY_DISPLAY, id, newDisplay);
    }

    public async removeEntry(id: string): Promise<HistoryEntry[]> {
        return await this.rpc.call(RpcMethodEnum.FEHISTORY_REMOVE_ENTRY, id);
    }

    public async clearHistory(): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.FEHISTORY_CLEAR_HISTORY);
    }

    public async softClearHistory(): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.FEHISTORY_SOFT_CLEAR_HISTORY);
    }

    public async clearHistoryWithMode(request: HistoryClearRequest): Promise<HistoryClearResult> {
        return await this.rpc.call(RpcMethodEnum.FEHISTORY_CLEAR_HISTORY_WITH_MODE, request);
    }

    public async getHistoryFilePath(): Promise<string> {
        return await this.rpc.call(RpcMethodEnum.FEHISTORY_GET_HISTORY_FILE_PATH);
    }

    public async openHistoryFile(): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.FEHISTORY_OPEN_HISTORY_FILE);
    }

    public async revealHistoryFile(): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.FEHISTORY_REVEAL_HISTORY_FILE);
    }
}

export const filesExporterHistoryApiService = new FilesExporterHistoryApiService();
