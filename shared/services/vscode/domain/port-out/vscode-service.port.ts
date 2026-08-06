import { IBackendService } from '../../../../core/backend-service.port';
import { LogLevel } from '../model/types';
import { VsCodeSettings } from '../model/VsCodeSettings.gen';

export interface IVsCodeServicePort extends IBackendService {
    logMessage(level: LogLevel, message: string, details?: any): Promise<void>;
    getExtentionSettings (): Promise<VsCodeSettings>;
}
