// src/webview/services/WebviewInitializerService.ts
import { useServiceStore } from '@/webview/store/useServiceStore';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { VsCodeSettings } from '@/common/VsCodeSettings';
import { logError, logInfo, logWarn } from '@/common/utils/utils-log';
import { initialCodebase } from '../../../sandbox/src/features/explorer/wksp-cnt-graph/components/graph/GraphData';
import { LoggerService } from '@/common/services/impl/LoggerService';
import { log } from 'console';


function getAppName(context: vscode.ExtensionContext): string {
    const packageData = context.extension.packageJSON;
    return packageData.name;
}

export function initializeVsCodeSettings(context: vscode.ExtensionContext): void {
    VsCodeSettings.init(getAppName(context));
}

export function initializeDefaultServices(context: vscode.ExtensionContext): void {
    const appName = getAppName(context);
    const register = useServiceStore.getState().registerService;
    register('logger', new LoggerService(context, appName));
    logInfo(`[WebviewInitializerService] Default services initialized for ${appName}.`);
    // todo register('api', new WebviewApiService());
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
}
