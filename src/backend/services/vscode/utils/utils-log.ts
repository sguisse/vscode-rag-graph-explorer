import { useBackendServiceStore } from '@/store/useBackendServiceStore';

function getLogger() {
  try {
    return useBackendServiceStore.getState().getBackendService('logger');
  } catch {
    return null;
  }
}

export function logInfo(message: string, ...args: unknown[]): void {
  const logger = getLogger();
  if (logger) {
    logger.info(message, ...args);
  } else {
    console.log(`[INFO] ${message}`, ...args);
  }
}

export function logWarn(message: string, ...args: unknown[]): void {
  const logger = getLogger();
  if (logger) {
    logger.warn(message, ...args);
  } else {
    console.warn(`[WARN] ${message}`, ...args);
  }
}

export function logError(message: string, ...args: unknown[]): void {
  const logger = getLogger();
  if (logger) {
    logger.error(message, ...args);
  } else {
    console.error(`[ERROR] ${message}`, ...args);
  }
}
