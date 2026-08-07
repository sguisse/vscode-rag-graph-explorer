// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:service-registrator

import * as vscode from 'vscode';
import { serviceRegistry } from '../core/ServiceRegistry';
import { ServiceEnum } from '../../../shared/config/service-enum.gen';

import { CodebaseMockAdapter } from '../services/graph-rag-explorer/codebase-service.adapter-mock';
import { GraphRagInstallerAdapter } from '../services/graph-rag-explorer/installer-service.adapter';
import { VsCodeServiceAdapter } from '../services/vscode/vscode-service.adapter';
import { ICodebaseServicePort } from '../../../shared/services/graph-rag-explorer/domain/port-out/codebase-service.port';
import { IGraphRagInstallerServicePort } from '../../../shared/services/graph-rag-explorer/domain/port-out/installer-service.port';
import { IVsCodeServicePort } from '../../../shared/services/vscode/domain/port-out/vscode-service.port';

export interface BackendServicesMap {
    [ServiceEnum.CODEBASE]: ICodebaseServicePort;
    [ServiceEnum.GRAPH_RAG_INSTALLER]: IGraphRagInstallerServicePort;
    [ServiceEnum.VS_CODE]: IVsCodeServicePort;
}

/**
 * Instantiates and registers all backend application services into the ServiceRegistry container.
 */
export function registerServices(context: vscode.ExtensionContext): void {
    const graphRagInstallerService = new GraphRagInstallerAdapter();
    serviceRegistry.register(ServiceEnum.GRAPH_RAG_INSTALLER, graphRagInstallerService);
    context.subscriptions.push(graphRagInstallerService);

    const codebaseService = new CodebaseMockAdapter();
    serviceRegistry.register(ServiceEnum.CODEBASE, codebaseService);
    context.subscriptions.push(codebaseService);

    const vsCodeService = new VsCodeServiceAdapter();
    serviceRegistry.register(ServiceEnum.VS_CODE, vsCodeService);
    context.subscriptions.push(vsCodeService);
}
