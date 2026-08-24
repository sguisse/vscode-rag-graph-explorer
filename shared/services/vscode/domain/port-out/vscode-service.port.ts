import { LogLevel } from '../model/types';
import { VsCodeSettings } from '../model/VsCodeSettings.gen';

export interface IVsCodeServicePort {
    logMessage(level: LogLevel, message: string, details?: any): Promise<void>;
    getExtensionSettings(): Promise<VsCodeSettings>;
    openUrl(url: string, inExternalBrowser: boolean): Promise<void>;
    openFile(targetPath: string): Promise<void>;
    readFile(filePath: string): Promise<string | undefined>;
    revealInExplorer(targetPath: string): Promise<void>;
    copyToClipboard(text: string): Promise<void>;
    saveUserPreferences(settingsKey: string, jsonPayload: Record<string, any>): Promise<void>;
    readUserPreferences(settingsKey: string): Promise<Record<string, any>>;
    readImageAsBase64(filePathOrUrl: string): Promise<string>;
}
