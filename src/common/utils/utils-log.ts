import { ILoggerService } from "../services/ILoggerService";
import { LoggerService, getGlobalLogger } from "../services/impl/LoggerService";

let loggerInstance: ILoggerService | null = null;

export function initLogger(channelName: string): ILoggerService {
    if (!loggerInstance) {
        loggerInstance = new LoggerService(channelName);
    }
    return loggerInstance;
}

export function getLogger(): ILoggerService | null {
    return loggerInstance || getGlobalLogger();
}

export function logInfo(message: string, ...args: any[]): void {
    const logger = getLogger();
    if (logger) {
        logger.info(message, ...args);
    } else {
        console.log(`[INFO ${new Date().toLocaleTimeString()}] ${message}`);
    }
}

export function logWarn(message: string, ...args: any[]): void {
    const logger = getLogger();
    if (logger) {
        logger.warn(message, ...args);
    } else {
        console.warn(`[WARN ${new Date().toLocaleTimeString()}] ${message}`);
    }
}

export function logError(message: string, ...args: any[]): void {
    const logger = getLogger();
    if (logger) {
        logger.error(message, ...args);
    } else {
        console.error(`[ERROR ${new Date().toLocaleTimeString()}] ${message}`);
    }
}

export function logDebug(message: string, ...args: any[]): void {
    const logger = getLogger();
    if (logger) {
        logger.debug(message, ...args);
    } else {
        console.debug(`[DEBUG ${new Date().toLocaleTimeString()}] ${message}`);
    }
}

export function logAppend(message: string): void {
    const logger = getLogger();
    if (logger) {
        logger.appendLine(message);
    } else {
        console.log(message);
    }
}
