export interface IExtensionServices {
    runPythonAnalysis(userId: string): Promise<string>;
    logMessage(level: 'info' | 'warn' | 'error', text: string, details?: any): Promise<void>;
}
