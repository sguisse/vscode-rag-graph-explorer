import { LogLevel } from '../../../shared/services/vscode/domain/model/types';
import { serviceRegistry } from '../core/ServiceRegistry';
import { ServiceEnum } from '../../../shared/config/service-enum.gen';
import { IVsCodeServicePort } from '../../../shared/services/vscode/domain/port-out/vscode-service.port';

let vscodeService: IVsCodeServicePort = undefined as unknown as IVsCodeServicePort; // Initialize as undefined, will be resolved lazily

function sendLog(level: LogLevel, message: string, details?: any): void {
    // Resolve service lazily when a log function is invoked
    if (!vscodeService) {
        vscodeService = serviceRegistry.get(ServiceEnum.VS_CODE);
    }

    vscodeService.logMessage(level, message, details).catch((error) => {
        console.error(`Failed to send log message: ${error}`);
    });
}

export function logDebug(message: string, data?: unknown[] | Error): void {
  sendLog('DEBUG', message, data);
}

export function logInfo(message: string, data?: unknown[] | Error): void {
  sendLog('INFO', message, data);
}

export function logWarn(message: string, data?: unknown[] | Error): void {
  sendLog('WARN', message, data);
}

export function logError(message: string, data?: unknown[] | Error): void {
  sendLog('ERROR', message, data);
}
