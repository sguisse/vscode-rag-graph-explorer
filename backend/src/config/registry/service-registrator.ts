import * as vscode from 'vscode';
import { serviceRegistry } from '../../core/ServiceRegistry';

import { VsCodeServiceAdapter } from '../../services/vscode/vscode-service.adapter';
import { ServiceEnum } from '../../../../shared/config/service-enum';
import { IVsCodeServicePort } from '../../../../shared/services/vscode/domain/port-out/vscode-service.port';


export interface BackendServicesMap {
    [ServiceEnum.VS_CODE]: IVsCodeServicePort;
}

/**
 * Instantiates and registers all backend application services into the ServiceRegistry container.
 */
export function registerServices(context: vscode.ExtensionContext): void {
    const vscodeService = new VsCodeServiceAdapter(context);
    serviceRegistry.register(ServiceEnum.VS_CODE, vscodeService);

    // Track disposables in VS Code extension context
    context.subscriptions.push(vscodeService);
}
