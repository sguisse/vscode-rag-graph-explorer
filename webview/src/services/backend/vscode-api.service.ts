import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum';
import { LogLevel } from '@/shared/services/vscode/domain/model/types';
import { AbstractApiService } from './abstract-api.service';
import { IVsCodeServicePort } from '@/shared/services/vscode/domain/port-out/vscode-service.port';
import { VsCodeSettings } from '@/shared/services/vscode/domain/model/VsCodeSettings';

class VsCodeApiService extends AbstractApiService implements IVsCodeServicePort {
    constructor() {
        super();
    }

    public async getExtentionSettings(): Promise<VsCodeSettings> {
        return await this.rpc.call(RpcMethodEnum.VSCODE_GET_EXTENTION_SETTINGS);
    }

    public async logMessage(level: LogLevel, message: string, details?: any): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.VSCODE_LOG_MESSAGE, level, message, details);
    }
}

export const vscodeApiService = new VsCodeApiService();
