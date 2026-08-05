import { IBackendService } from './backend-service.interface';
import { LogLevel } from './vscode/domain/model/types';

export interface ILoggerService extends IBackendService {
    logMessage(level: LogLevel, message: string, details?: any): Promise<void>;
}
