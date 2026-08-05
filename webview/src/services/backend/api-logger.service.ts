import { getVsCodeApi } from '@/lib/utils-vscode';
import { RpcProtocol } from '@/shared/rpc/rpc-protocol';
import { ILoggerService } from '@/shared/services/logger-service.interface';
import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum';
import { LogLevel } from '@/shared/services/vscode/domain/model/types';
import { AbstractApiService } from './api-abstract.service';

class LoggerService extends AbstractApiService implements ILoggerService {
    constructor() {
        super();
    }

    public async logMessage(level: LogLevel, message: string, details?: any): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.LOG_MESSAGE, level, message, details);
    }
}

export const loggerService = new LoggerService();
