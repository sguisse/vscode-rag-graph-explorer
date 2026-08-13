import { LogLevel } from '../model/types';
import { VsCodeSettings } from '../model/VsCodeSettings.gen';

export interface IVsCodeServicePort {
    logMessage(level: LogLevel, message: string, details?: any): Promise<void>;
    getExtensionSettings(): Promise<VsCodeSettings>;
    openUrl(url: string, inExternalBrowser: boolean): Promise<void>;
    revealInExplorer(targetPath: string): Promise<void>;
    copyToClipboard(text: string): Promise<void>;
}
