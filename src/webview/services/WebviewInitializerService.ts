import { useBackendServiceStore } from '@/store/useBackendServiceStore';

import * as vscode from 'vscode';
import { CodebaseAdapter } from '@/backend/services/codebase/infrastructure/codebase-service.adapter-mock';
import { VsCodeSettings } from '@/backend/services/vscode/domain/model/VsCodeSettings';
import { logInfo } from '@/backend/services/vscode/utils/utils-log';
import { LoggerAdapter } from '@/backend/services/vscode/infrastructure/logger-service.adpter';

function getAppName(context: vscode.ExtensionContext): string {
    const packageData = context.extension.packageJSON;
    return packageData.name;
}

export function initializeVsCodeSettings(context: vscode.ExtensionContext): void {
    VsCodeSettings.init(getAppName(context));
}

export function initializeDefaultServices(context: vscode.ExtensionContext): void {
    const appName = getAppName(context);
    const register = useBackendServiceStore.getState().registerService;
    register('codebaseService', new CodebaseAdapter());
    register('logger', new LoggerAdapter(appName));
    logInfo(`[WebviewInitializerService] Default services initialized for ${appName}.`);
}

export function sendConfig(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): void {
    const host = VsCodeSettings.get<string>('neo4j.host', 'localhost');
    const portHttp = VsCodeSettings.get<number>('neo4j.port.http', 7474);
    const neo4jUrl = `http://${host}:${portHttp}/browser/preview/`;

    panel.webview.postMessage({
        command: 'setConfig',
        config: {
            entitiesTypesList: VsCodeSettings.get('entitiesTypesList'),
            regexFilterEnabled: VsCodeSettings.get('regexFilterEnabled'),
            treeFilterEnabled: VsCodeSettings.get('treeFilterEnabled'),
            geminiApiKey: VsCodeSettings.get('geminiApiKey'),
            tooltipDelay: VsCodeSettings.get('tooltipDelay', 2000),
            extensionVersion: context.extension.packageJSON.version,
            neo4jUrl: neo4jUrl
        }
    });
}
