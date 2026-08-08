// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { LogLevel } from '@/shared/services/vscode/domain/model/types';
import { VsCodeSettings } from '@/shared/services/vscode/domain/model/VsCodeSettings.gen';
import { IVsCodeServicePort } from '@/shared/services/vscode/domain/port-out/vscode-service.port';

class VsCodeApiService extends AbstractApiService implements IVsCodeServicePort {
    constructor() {
        super();
    }

    public async logMessage(level: LogLevel, message: string, details?: any): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.VSCODE_LOG_MESSAGE, level, message, details);
    }

    public async getExtentionSettings(): Promise<VsCodeSettings> {
        return await this.rpc.call(RpcMethodEnum.VSCODE_GET_EXTENTION_SETTINGS);
    }

    public async openUrl(url: string, inExternalBrowser: boolean): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.VSCODE_OPEN_URL, url, inExternalBrowser);
    }
}

export const vsCodeApiService = new VsCodeApiService();
