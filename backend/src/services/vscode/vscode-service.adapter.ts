import * as vscode from 'vscode';
import { IVsCodeServicePort } from '../../../../shared/services/vscode/domain/port-out/vscode-service.port';
import { getAppName } from '../../utils/utils-vscode';
import { LogLevel } from '../../../../shared/services/vscode/domain/model/types';
import { logMessage as logMessageDelegate} from './delegate/logger.delegate';
import { getExtentionSettings as getExtentionSettingsDelegate} from './delegate/export-extention-settings.delegate';
import { VsCodeSettings } from '../../../../shared/services/vscode/domain/model/VsCodeSettings.gen';

export class VsCodeServiceAdapter implements IVsCodeServicePort, vscode.Disposable {
    private context: vscode.ExtensionContext;
    private logChannel: vscode.LogOutputChannel;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        const appName = getAppName(this.context);
        this.logChannel = vscode.window.createOutputChannel(`${appName}`, { log: true });
    }

    public async logMessage(level: LogLevel, message: string, details?: any): Promise<void> {
        logMessageDelegate(this.logChannel, level, message, details);
    }

    public async getExtentionSettings(): Promise<VsCodeSettings> {
        return getExtentionSettingsDelegate(this.context);
    }

    public dispose() {
        this.logChannel.dispose();
    }
}
