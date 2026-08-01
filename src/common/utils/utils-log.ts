import { ILoggerService } from "../services/ILoggerService";
import { LoggerService } from "../services/impl/LoggerService";

let loggerInstance: ILoggerService | null = null;

/**
 * Initializes and manages the central LoggerService instance.
 */
export function initLogger(channelName: string): ILoggerService {
    if (!loggerInstance) {
        loggerInstance = new LoggerService(channelName);
    }
    return loggerInstance;
}

/**
 * Retrieves the active LoggerService instance.
 */
export function getLogger(): ILoggerService | null {
    return loggerInstance;
}

/**
 * Direct log helper functions supporting SLF4J ({}), % formatting, and Error objects.
 */
export function logInfo(message: string, ...args: any[]): void {
    if (loggerInstance) {
        loggerInstance.info(message, ...args);
    }
}

export function logWarn(message: string, ...args: any[]): void {
    if (loggerInstance) {
        loggerInstance.warn(message, ...args);
    }
}

export function logError(message: string, ...args: any[]): void {
    if (loggerInstance) {
        loggerInstance.error(message, ...args);
    }
}

export function logDebug(message: string, ...args: any[]): void {
    if (loggerInstance) {
        loggerInstance.debug(message, ...args);
    }
}

export function logAppend(message: string): void {
    if (loggerInstance) {
        loggerInstance.appendLine(message);
    }
}
