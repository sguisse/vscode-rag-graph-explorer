import { LogLevel } from '../types';
import { VsCodeSettings } from '../model/VsCodeSettings.gen';

export interface IVsCodeServicePort {
    getRepoName(): Promise<string>;
    getWorkspaceRootPath(): Promise<string>;
    logMessage(level: LogLevel, message: string, details?: any): Promise<void>;
    getExtensionSettings(): Promise<VsCodeSettings>;
    openUrl(url: string, inExternalBrowser: boolean): Promise<void>;
    openFile(targetPath: string): Promise<void>;
    revealInExplorer(targetPath: string): Promise<void>;
    copyToClipboard(text: string): Promise<void>;
    saveUserPreferences(settingsKey: string, jsonPayload: Record<string, any>): Promise<void>;
    readUserPreferences(settingsKey: string): Promise<Record<string, any>>;
}
