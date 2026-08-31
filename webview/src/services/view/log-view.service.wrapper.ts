import { LogLevel } from "@/shared/services/vscode/types";
import { vsCodeApiService } from "../api/vs-code-api.service.gen";

function formatDetails(details?: any): any {
    if (details instanceof Error) {
        return { message: details.message, stack: details.stack };
    }
    return details;
}

function sendLog(level: LogLevel, message: string, details?: any): void {
    vsCodeApiService.logMessage(level, message, formatDetails(details)).catch((error: unknown) => {
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
