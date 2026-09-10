import { LogLevel } from '../types';
import { VsCodeSettings } from '../model/VsCodeSettings.gen';
import { RichNotificationOptions } from '../model/vscode-rich-notification';

export interface IVsCodeServicePort {
    getRepoName(): Promise<string>;
    getWorkspaceRootPath(): Promise<string>;
    logMessage(level: LogLevel, message: string, details?: any): Promise<void>;
    getExtensionSettings(): Promise<VsCodeSettings>;
    showRichNotification(
        fallbackText: string,
        options?: RichNotificationOptions,
        callback?: (command: string, payload: any) => void
    ): Promise<void>;
    openSettings(settingKey?: string): Promise<void>;
    openSourceControl(): Promise<void>;
    openUrl(url: string, inExternalBrowser: boolean): Promise<void>;
    openFile(targetPath: string): Promise<void>;
    revealInExplorer(targetPath: string): Promise<void>;
    revealInOsExplorer(targetPath: string): Promise<void>;
    copyToClipboard(text: string): Promise<void>;
    saveUserPreferences(settingsKey: string, jsonPayload: Record<string, any>): Promise<void>;
    readUserPreferences(settingsKey: string): Promise<Record<string, any>>;
}
