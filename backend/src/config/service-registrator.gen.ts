// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:service-registrator

import * as vscode from 'vscode';
import { serviceRegistry } from '../core/ServiceRegistry';
import { ServiceEnum } from '../../../shared/config/service-enum.gen';

import { GraphRagInstallerAdapter } from '../services/graph-rag-explorer/installer-service.adapter';
import { Neo4jAdapter } from '../services/graph-rag-explorer/neo4j-service.adapter';
import { VsCodeServiceAdapter } from '../services/vscode/vscode-service.adapter';
import { IGraphRagInstallerServicePort } from '../../../shared/services/graph-rag-explorer/domain/port-out/installer-service.port';
import { INeo4jServicePort } from '../../../shared/services/graph-rag-explorer/domain/port-out/neo4j-service.port';
import { IVsCodeServicePort } from '../../../shared/services/vscode/domain/port-out/vscode-service.port';

export interface BackendServicesMap {
    [ServiceEnum.GRAPH_RAG_INSTALLER]: IGraphRagInstallerServicePort;
    [ServiceEnum.NEO4J]: INeo4jServicePort;
    [ServiceEnum.VS_CODE]: IVsCodeServicePort;
}

/**
 * Instantiates and registers all backend application services into the ServiceRegistry container.
 */
export function registerServices(context: vscode.ExtensionContext): void {
    const graphRagInstallerService = new GraphRagInstallerAdapter();
    serviceRegistry.register(ServiceEnum.GRAPH_RAG_INSTALLER, graphRagInstallerService);
    context.subscriptions.push(graphRagInstallerService);

    const neo4jService = new Neo4jAdapter();
    serviceRegistry.register(ServiceEnum.NEO4J, neo4jService);
    context.subscriptions.push(neo4jService);

    const vsCodeService = new VsCodeServiceAdapter();
    serviceRegistry.register(ServiceEnum.VS_CODE, vsCodeService);
    context.subscriptions.push(vsCodeService);
}
