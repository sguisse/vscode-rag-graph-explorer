import { serviceRegistry } from '@/backend/config/registry/ServiceRegistry';
import * as vscode from 'vscode';
import { CodebaseMockAdapter } from '@/backend/services/codebase/infrastructure/codebase-service.adapter-mock';
import { VsCodeSettings } from '@/backend/services/vscode/domain/model/VsCodeSettings';
import { logInfo } from '@/backend/services/vscode/utils/utils-backend-log';


export function getAppName(context: vscode.ExtensionContext): string {
    const packageData = context.extension.packageJSON;
    return packageData.name|| packageData.displayName;
}

export function initializeVsCodeSettings(context: vscode.ExtensionContext): void {
    VsCodeSettings.init(getAppName(context));
}

export function initializeDefaultServices(): void {
    serviceRegistry.register('codebaseService', new CodebaseMockAdapter());
    logInfo(`[WebviewInitializerService] Default services initialized successfully.`);
}

/**
 * Sends host configuration parameters to the webview.
 */
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

    logInfo(`[WebviewInitializerService] sendConfig done.`);
}
