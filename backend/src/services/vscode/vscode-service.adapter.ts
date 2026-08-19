import * as vscode from 'vscode';
import { IVsCodeServicePort } from '../../../../shared/services/vscode/domain/port-out/vscode-service.port';
import { getAppNormalizedNameFromPackageJson, getCurrentExtensionContext, getWorkspaceRoot } from '../../utils/utils-vscode';
import { LogLevel } from '../../../../shared/services/vscode/domain/model/types';
import { logMessageFromRemote as logMessageDelegate} from './delegate/logger.delegate';
import { getExtensionSettings as getExtensionSettingsDelegate} from './delegate/get-extension-settings.delegate';
import { readImageAsBase64 as readImageAsBase64Delegate } from './delegate/local-image-reader.delegate';
import { VsCodeSettings } from '../../../../shared/services/vscode/domain/model/VsCodeSettings.gen';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logChannel, logError, logInfo, logWarn } from '../../utils/utils-log';
import path from 'path';
import fs from 'fs';
import { VsCodeSettingsManager, vsCodeSettingsManager } from '../../managers/VsCodeSettings.manager';

export class VsCodeServiceAdapter extends AbstractServiceAdapter implements IVsCodeServicePort, vscode.Disposable {
    constructor() {
        super();
    }

    public async logMessage(level: LogLevel, message: string, details?: any): Promise<void> {
        logMessageDelegate(level, message, details);
    }

    public async getExtensionSettings(): Promise<VsCodeSettings> {
        return getExtensionSettingsDelegate(getCurrentExtensionContext());
    }

    public async openUrl(url: string, inExternalBrowser: boolean): Promise<void> {
        if (inExternalBrowser) {
            await vscode.env.openExternal(vscode.Uri.parse(url));
        } else {
            await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
        }
    }

    public async revealInExplorer(targetPath: string): Promise<void> {
        logInfo(`[VsCodeServiceAdapter] revealInExplorer invoked with path: ${targetPath}`);
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            const rootPath = workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : getWorkspaceRoot();
            let fullPath = targetPath;

            if (!path.isAbsolute(fullPath) && rootPath) {
                fullPath = path.join(rootPath, fullPath);
            }

            fullPath = this.resolveSourceFilePath(fullPath);

            if (fs.existsSync(fullPath)) {
                logInfo(`[VsCodeServiceAdapter] Revealing file in VS Code Explorer: ${fullPath}`);
                const uri = vscode.Uri.file(fullPath);
                await vscode.commands.executeCommand('revealInExplorer', uri);
                const doc = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(doc, { preview: true, preserveFocus: true });
            } else {
                logWarn(`[VsCodeServiceAdapter] Resolved file path does not exist: ${fullPath}`);
            }
        } catch (err) {
            logError(`[VsCodeServiceAdapter] Failed to reveal file in explorer: ${err}`);
        }
    }

    private resolveSourceFilePath(filePath: string): string {
        if (!filePath.endsWith('.class')) {
            return filePath;
        }

        let javaPath = filePath.replace(/\$[^/]+\.class$/, '.class').replace(/\.class$/, '.java');

        const replacements = [
            { from: '/target/classes/', to: '/src/main/java/' },
            { from: '/target/test-classes/', to: '/src/test/java/' },
            { from: '/build/classes/java/main/', to: '/src/main/java/' },
            { from: '/build/classes/java/test/', to: '/src/test/java/' },
            { from: '/out/production/', to: '/src/' }
        ];

        for (const { from, to } of replacements) {
            if (javaPath.includes(from)) {
                const candidate = javaPath.replace(from, to);
                if (fs.existsSync(candidate)) {
                    return candidate;
                }
            }
        }

        if (fs.existsSync(javaPath)) {
            return javaPath;
        }

        return filePath;
    }

    public async copyToClipboard(text: string): Promise<void> {
        logInfo(`[VsCodeServiceAdapter] copyToClipboard invoked (${text.length} chars)`);
        try {
            await vscode.env.clipboard.writeText(text);
        } catch (err) {
            logError(`[VsCodeServiceAdapter] Failed to copy to clipboard: ${err}`);
            throw err;
        }
    }

    public async saveUserPreferences(settingsKey: string, jsonPayload: Record<string, any>): Promise<void> {
        logInfo(`[VsCodeServiceAdapter] saveUserPreferences invoked for key: ${settingsKey}`);
        try {
            const relativeKey = settingsKey.startsWith(`${VsCodeSettingsManager.SCOPE}.`)
                ? settingsKey.slice(VsCodeSettingsManager.SCOPE.length + 1)
                : settingsKey;

            const config = vscode.workspace.getConfiguration(VsCodeSettingsManager.SCOPE);
            const stringArray = vsCodeSettingsManager.jsonToStringArray(jsonPayload);
            await config.update(relativeKey, stringArray, vscode.ConfigurationTarget.Workspace);
        } catch (err) {
            logError(`[VsCodeServiceAdapter] Failed to save user preferences for key ${settingsKey}:`, err);
            throw err;
        }
    }

    public async readUserPreferences(settingsKey: string): Promise<Record<string, any>> {
        logInfo(`[VsCodeServiceAdapter] readUserPreferences invoked for key: ${settingsKey}`);
        try {
            const relativeKey = settingsKey.startsWith(`${VsCodeSettingsManager.SCOPE}.`)
                ? settingsKey.slice(VsCodeSettingsManager.SCOPE.length + 1)
                : settingsKey;

            const config = vscode.workspace.getConfiguration(VsCodeSettingsManager.SCOPE);
            const value = config.get<string[]>(relativeKey);

            if (!value) {
                return {};
            }

            return vsCodeSettingsManager.stringArrayToJson(value).data;
        } catch (err) {
            logError(`[VsCodeServiceAdapter] Failed to read user preferences for key ${settingsKey}:`, err);
            return {};
        }
    }

    public async readImageAsBase64(filePathOrUrl: string): Promise<string> {
        return readImageAsBase64Delegate(filePathOrUrl);
    }

    public dispose() {
        if (logChannel) {
            logChannel.dispose();
        }
    }
}
