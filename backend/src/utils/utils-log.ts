import { LogLevel } from '../../../shared/services/vscode/domain/model/types';
import { serviceRegistry } from '../core/ServiceRegistry';
import { ServiceEnum } from '../../../shared/config/service-enum.gen';
import { IVsCodeServicePort } from '../../../shared/services/vscode/domain/port-out/vscode-service.port';

let vscodeService: IVsCodeServicePort = undefined as unknown as IVsCodeServicePort; // Initialize as undefined, will be resolved lazily

function sendLog(level: LogLevel, message: string, details?: any): void {
    // Resolve service lazily when a log function is invoked
    if (!vscodeService) {
        if (serviceRegistry.has(ServiceEnum.VS_CODE)) {
            vscodeService = serviceRegistry.get(ServiceEnum.VS_CODE);
        } else {
            console.log(`[${level}] ${message}`, details !== undefined ? details : "");
            return;
        }
    }

    vscodeService.logMessage(level, message, details).catch((error) => {
        console.error(`Failed to send log message: ${error}`);
    });
}

export function logDebug(message: string, details?: any): void {
  sendLog('DEBUG', message, details);
}

export function logInfo(message: string, details?: any): void {
  sendLog('INFO', message, details);
}

export function logWarn(message: string, details?: any): void {
  sendLog('WARN', message, details);
}

export function logError(message: string, details?: any): void {
  sendLog('ERROR', message, details);
}
