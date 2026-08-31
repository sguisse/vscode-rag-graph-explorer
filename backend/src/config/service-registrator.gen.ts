// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:service-registrator

import * as vscode from 'vscode';
import { serviceRegistry } from '../core/ServiceRegistry';
import { ServiceEnum } from '../../../shared/config/service-enum.gen';

import { CodebaseExporterAdapter } from '../services/codebase-exporter/codebase-exporter-service.adapter';
import { BlastRadiusErrorFilesIdentificatorAdapter } from '../services/errors/blast-radius-error-files-identificator-service.adapter';
import { FileSystemAdapter } from '../services/file-system/file-system-service.adapter';
import { FilesExporterHistoryAdapter } from '../services/files-exporter/fe-history-service.adapter';
import { FilesExporterAdapter } from '../services/files-exporter/files-exporter-service.adapter';
import { GitServiceAdapter } from '../services/git/git-service.adapter';
import { GraphRagExplorerAdapter } from '../services/graph-rag-explorer/grag-explorer-service.adapter';
import { GraphRagInstallerAdapter } from '../services/graph-rag-explorer/grag-installer-service.adapter';
import { ImageAdapter } from '../services/images/image-service.adapter';
import { LlmChatServiceAdapter } from '../services/llm-chat/llm-chat-service.adapter';
import { Neo4jAdapter } from '../services/neo4j/neo4j-service.adapter';
import { SdlcSessionAdapter } from '../services/sdlc-session/sdlc-session-service.adapter';
import { VsCodeServiceAdapter } from '../services/vscode/vscode-service.adapter';
import { ICodebaseExporterServicePort } from '../../../shared/services/codebase-exporter/domain/port-out/codebase-exporter-service.port';
import { IBlastRadiusErrorFilesIdentificatorServicePort } from '../../../shared/services/errors/domain/model/port-out/blast-radius-error-files-identificator-service.port';
import { IFileSystemServicePort } from '../../../shared/services/file-system/model/port-out/file-system-service.port';
import { IFilesExporterHistoryServicePort } from '../../../shared/services/files-exporter/model/port-out/fe-history-service.port';
import { IFilesExporterServicePort } from '../../../shared/services/files-exporter/model/port-out/files-exporter-service.port';
import { IGitServicePort } from '../../../shared/services/git/domain/model/port-out/git-service.port';
import { IGraphRagExplorerServicePort } from '../../../shared/services/graph-rag-explorer/domain/port-out/grag-explorer-service.port';
import { IGraphRagInstallerServicePort } from '../../../shared/services/graph-rag-explorer/domain/port-out/grag-installer-service.port';
import { IImageServicePort } from '../../../shared/services/images/model/port-out/image-service.port';
import { ILlmChatServicePort } from '../../../shared/services/llm-chat/domain/port-out/llm-chat-service.port';
import { INeo4jServicePort } from '../../../shared/services/neo4j/domain/port-out/neo4j-service.port';
import { ISdlcSessionServicePort } from '../../../shared/services/sdlc-session/domain/port-out/sdlc-session-service.port';
import { IVsCodeServicePort } from '../../../shared/services/vscode/domain/port-out/vscode-service.port';

export interface BackendServicesMap {
    [ServiceEnum.CODEBASE_EXPORTER]: ICodebaseExporterServicePort;
    [ServiceEnum.BLAST_RADIUS_ERROR_FILES_IDENTIFICATOR]: IBlastRadiusErrorFilesIdentificatorServicePort;
    [ServiceEnum.FILE_SYSTEM]: IFileSystemServicePort;
    [ServiceEnum.FILES_EXPORTER_HISTORY]: IFilesExporterHistoryServicePort;
    [ServiceEnum.FILES_EXPORTER]: IFilesExporterServicePort;
    [ServiceEnum.GIT]: IGitServicePort;
    [ServiceEnum.GRAPH_RAG_EXPLORER]: IGraphRagExplorerServicePort;
    [ServiceEnum.GRAPH_RAG_INSTALLER]: IGraphRagInstallerServicePort;
    [ServiceEnum.IMAGE]: IImageServicePort;
    [ServiceEnum.LLM_CHAT]: ILlmChatServicePort;
    [ServiceEnum.NEO4J]: INeo4jServicePort;
    [ServiceEnum.SDLC_SESSION]: ISdlcSessionServicePort;
    [ServiceEnum.VS_CODE]: IVsCodeServicePort;
}

/**
 * Instantiates and registers all backend application services into the ServiceRegistry container.
 */
export function registerServices(context: vscode.ExtensionContext): void {
    const codebaseExporterService = new CodebaseExporterAdapter();
    serviceRegistry.register(ServiceEnum.CODEBASE_EXPORTER, codebaseExporterService);
    context.subscriptions.push(codebaseExporterService);

    const blastRadiusErrorFilesIdentificatorService = new BlastRadiusErrorFilesIdentificatorAdapter();
    serviceRegistry.register(ServiceEnum.BLAST_RADIUS_ERROR_FILES_IDENTIFICATOR, blastRadiusErrorFilesIdentificatorService);
    context.subscriptions.push(blastRadiusErrorFilesIdentificatorService);

    const fileSystemService = new FileSystemAdapter();
    serviceRegistry.register(ServiceEnum.FILE_SYSTEM, fileSystemService);
    context.subscriptions.push(fileSystemService);

    const filesExporterHistoryService = new FilesExporterHistoryAdapter();
    serviceRegistry.register(ServiceEnum.FILES_EXPORTER_HISTORY, filesExporterHistoryService);
    context.subscriptions.push(filesExporterHistoryService);

    const filesExporterService = new FilesExporterAdapter();
    serviceRegistry.register(ServiceEnum.FILES_EXPORTER, filesExporterService);
    context.subscriptions.push(filesExporterService);

    const gitService = new GitServiceAdapter();
    serviceRegistry.register(ServiceEnum.GIT, gitService);
    context.subscriptions.push(gitService);

    const graphRagExplorerService = new GraphRagExplorerAdapter();
    serviceRegistry.register(ServiceEnum.GRAPH_RAG_EXPLORER, graphRagExplorerService);
    context.subscriptions.push(graphRagExplorerService);

    const graphRagInstallerService = new GraphRagInstallerAdapter();
    serviceRegistry.register(ServiceEnum.GRAPH_RAG_INSTALLER, graphRagInstallerService);
    context.subscriptions.push(graphRagInstallerService);

    const imageService = new ImageAdapter();
    serviceRegistry.register(ServiceEnum.IMAGE, imageService);
    context.subscriptions.push(imageService);

    const llmChatService = new LlmChatServiceAdapter();
    serviceRegistry.register(ServiceEnum.LLM_CHAT, llmChatService);

    const neo4jService = new Neo4jAdapter();
    serviceRegistry.register(ServiceEnum.NEO4J, neo4jService);
    context.subscriptions.push(neo4jService);

    const sdlcSessionService = new SdlcSessionAdapter();
    serviceRegistry.register(ServiceEnum.SDLC_SESSION, sdlcSessionService);
    context.subscriptions.push(sdlcSessionService);

    const vsCodeService = new VsCodeServiceAdapter();
    serviceRegistry.register(ServiceEnum.VS_CODE, vsCodeService);
    context.subscriptions.push(vsCodeService);
}
