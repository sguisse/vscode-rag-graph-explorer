// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:service-registrator

import * as vscode from 'vscode';
import { serviceRegistry } from '../core/ServiceRegistry';
import { ServiceEnum } from '../../../shared/config/service-enum.gen';

import { CodebaseExporterAdapter } from '../services/codebase-exporter/codebase-exporter-service.adapter';
import { GraphRagExplorerAdapter } from '../services/graph-rag-explorer/grag-explorer-service.adapter';
import { GraphRagInstallerAdapter } from '../services/graph-rag-explorer/grag-installer-service.adapter';
import { LlmChatServiceAdapter } from '../services/llm-chat/llm-chat-service.adapter';
import { Neo4jAdapter } from '../services/neo4j/neo4j-service.adapter';
import { VsCodeServiceAdapter } from '../services/vscode/vscode-service.adapter';
import { ICodebaseExporterServicePort } from '../../../shared/services/codebase-exporter/domain/port-out/codebase-exporter-service.port';
import { IGraphRagExplorerServicePort } from '../../../shared/services/graph-rag-explorer/domain/port-out/grag-explorer-service.port';
import { IGraphRagInstallerServicePort } from '../../../shared/services/graph-rag-explorer/domain/port-out/grag-installer-service.port';
import { ILlmChatServicePort } from '../../../shared/services/llm-chat/domain/port-out/llm-chat-service.port';
import { INeo4jServicePort } from '../../../shared/services/neo4j/domain/port-out/neo4j-service.port';
import { IVsCodeServicePort } from '../../../shared/services/vscode/domain/port-out/vscode-service.port';

export interface BackendServicesMap {
    [ServiceEnum.CODEBASE_EXPORTER]: ICodebaseExporterServicePort;
    [ServiceEnum.GRAPH_RAG_EXPLORER]: IGraphRagExplorerServicePort;
    [ServiceEnum.GRAPH_RAG_INSTALLER]: IGraphRagInstallerServicePort;
    [ServiceEnum.LLM_CHAT]: ILlmChatServicePort;
    [ServiceEnum.NEO4J]: INeo4jServicePort;
    [ServiceEnum.VS_CODE]: IVsCodeServicePort;
}

/**
 * Instantiates and registers all backend application services into the ServiceRegistry container.
 */
export function registerServices(context: vscode.ExtensionContext): void {
    const codebaseExporterService = new CodebaseExporterAdapter();
    serviceRegistry.register(ServiceEnum.CODEBASE_EXPORTER, codebaseExporterService);
    context.subscriptions.push(codebaseExporterService);

    const graphRagExplorerService = new GraphRagExplorerAdapter();
    serviceRegistry.register(ServiceEnum.GRAPH_RAG_EXPLORER, graphRagExplorerService);
    context.subscriptions.push(graphRagExplorerService);

    const graphRagInstallerService = new GraphRagInstallerAdapter();
    serviceRegistry.register(ServiceEnum.GRAPH_RAG_INSTALLER, graphRagInstallerService);
    context.subscriptions.push(graphRagInstallerService);

    const llmChatService = new LlmChatServiceAdapter();
    serviceRegistry.register(ServiceEnum.LLM_CHAT, llmChatService);

    const neo4jService = new Neo4jAdapter();
    serviceRegistry.register(ServiceEnum.NEO4J, neo4jService);
    context.subscriptions.push(neo4jService);

    const vsCodeService = new VsCodeServiceAdapter();
    serviceRegistry.register(ServiceEnum.VS_CODE, vsCodeService);
    context.subscriptions.push(vsCodeService);
}
