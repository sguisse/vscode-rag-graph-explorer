import { LogLevel } from "@/shared/services/vscode/domain/model/types";
import { vscodeApiService } from "../backend/vscode-api.service";

function sendLog(level: LogLevel, message: string, details?: any): void {
    vscodeApiService.logMessage(level, message, details).catch((error) => {
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
