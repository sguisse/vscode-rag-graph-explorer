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

    public async getExtensionSettings(): Promise<VsCodeSettings> {
        return await this.rpc.call(RpcMethodEnum.VSCODE_GET_EXTENSION_SETTINGS);
    }

    public async openUrl(url: string, inExternalBrowser: boolean): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.VSCODE_OPEN_URL, url, inExternalBrowser);
    }

    public async revealInExplorer(targetPath: string): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.VSCODE_REVEAL_IN_EXPLORER, targetPath);
    }

    public async copyToClipboard(text: string): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.VSCODE_COPY_TO_CLIPBOARD, text);
    }

    public async saveUserPreferences(settingsKey: string, jsonPayload: Record<string, any>): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.VSCODE_SAVE_USER_PREFERENCES, settingsKey, jsonPayload);
    }

    public async readUserPreferences(settingsKey: string): Promise<Record<string, any>> {
        return await this.rpc.call(RpcMethodEnum.VSCODE_READ_USER_PREFERENCES, settingsKey);
    }
}

export const vsCodeApiService = new VsCodeApiService();
