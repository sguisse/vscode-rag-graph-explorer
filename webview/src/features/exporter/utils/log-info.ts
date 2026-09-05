import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';

export function logInfo(message: string, ...args: any[]) {
  console.log(`[LOG_INFO] ${message}`, ...args);
  try {
    vsCodeApiService.logMessage('info', `${message} ${args.length ? JSON.stringify(args) : ''}`);
  } catch (e) {
    // Fallback if VS Code API service is not yet fully initialized
  }
}
