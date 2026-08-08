import * as vscode from 'vscode';
import { IVsCodeServicePort } from '../../../../shared/services/vscode/domain/port-out/vscode-service.port';
import { getAppNameFromPackageJson, getCurrentExtensionContext } from '../../utils/utils-vscode';
import { LogLevel } from '../../../../shared/services/vscode/domain/model/types';
import { logMessage as logMessageDelegate} from './delegate/logger.delegate';
import { getExtentionSettings as getExtentionSettingsDelegate} from './delegate/get-extention-settings.delegate';
import { VsCodeSettings } from '../../../../shared/services/vscode/domain/model/VsCodeSettings.gen';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';

export class VsCodeServiceAdapter extends AbstractServiceAdapter implements IVsCodeServicePort, vscode.Disposable {
    private logChannel: vscode.LogOutputChannel;

    constructor() {
        super();
        const appName = getAppNameFromPackageJson(getCurrentExtensionContext());
        this.logChannel = vscode.window.createOutputChannel(`${appName}`, { log: true });
        this.logChannel.show();
    }

    public async logMessage(level: LogLevel, message: string, details?: any): Promise<void> {
        logMessageDelegate(this.logChannel, level, message, details);
    }

    public async getExtentionSettings(): Promise<VsCodeSettings> {
        return getExtentionSettingsDelegate(getCurrentExtensionContext());
    }

    public async openUrl(url: string, inExternalBrowser: boolean): Promise<void> {
        if (inExternalBrowser) {
            await vscode.env.openExternal(vscode.Uri.parse(url));
        } else {
            await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
        }
    }

    public dispose() {
        this.logChannel.dispose();
    }
}
