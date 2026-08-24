// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:rpc-registrator

import { serviceRegistry } from '../core/ServiceRegistry';
import { ServiceEnum } from '../../../shared/config/service-enum.gen';
import { RpcMethodEnum } from '../../../shared/config/rpc-methods.enum.gen';
import { RpcProtocol } from '../../../shared/rpc/rpc-protocol';

/**
 * Resolves services from the ServiceRegistry and registers all RPC protocol handlers.
 */
export function registerRpcMethods(rpc: RpcProtocol): void {
    const codebaseExporterService = serviceRegistry.get(ServiceEnum.CODEBASE_EXPORTER);
    rpc.register(RpcMethodEnum.CODEBASEEXPORTER_EXPORT_SELECTED_FILES, codebaseExporterService.exportSelectedFiles.bind(codebaseExporterService));
    rpc.register(RpcMethodEnum.CODEBASEEXPORTER_EXPORT_FILES, codebaseExporterService.exportFiles.bind(codebaseExporterService));
    rpc.register(RpcMethodEnum.CODEBASEEXPORTER_GET_EXPORT_FILES_STATUS, codebaseExporterService.getExportFilesStatus.bind(codebaseExporterService));
    rpc.register(RpcMethodEnum.CODEBASEEXPORTER_GET_EXPORT_FILES_RESULT, codebaseExporterService.getExportFilesResult.bind(codebaseExporterService));
    rpc.register(RpcMethodEnum.CODEBASEEXPORTER_READ_EXPORTED_FILES_CONTENT, codebaseExporterService.readExportedFilesContent.bind(codebaseExporterService));
    rpc.register(RpcMethodEnum.CODEBASEEXPORTER_STORE_EXPORTED_FILES_IN_CLIPBOARD, codebaseExporterService.storeExportedFilesInClipboard.bind(codebaseExporterService));

    const graphRagExplorerService = serviceRegistry.get(ServiceEnum.GRAPH_RAG_EXPLORER);
    rpc.register(RpcMethodEnum.GRAGEXPLORER_GET_PATHS_CHANGE_IMPACTS, graphRagExplorerService.getPathsChangeImpacts.bind(graphRagExplorerService));

    const graphRagInstallerService = serviceRegistry.get(ServiceEnum.GRAPH_RAG_INSTALLER);
    rpc.register(RpcMethodEnum.GRAGINSTALLER_CHECK_INSTALLATION_STATUS, graphRagInstallerService.checkInstallationStatus.bind(graphRagInstallerService));
    rpc.register(RpcMethodEnum.GRAGINSTALLER_UNINSTALL_ALL, graphRagInstallerService.uninstallAll.bind(graphRagInstallerService));

    const llmChatService = serviceRegistry.get(ServiceEnum.LLM_CHAT);
    rpc.register(RpcMethodEnum.LLMCHAT_EXECUTE_CHAT, llmChatService.executeChat.bind(llmChatService));
    rpc.register(RpcMethodEnum.LLMCHAT_STREAM_CHAT, llmChatService.streamChat.bind(llmChatService));
    rpc.register(RpcMethodEnum.LLMCHAT_LIST_AVAILABLE_MODELS, llmChatService.listAvailableModels.bind(llmChatService));
    rpc.register(RpcMethodEnum.LLMCHAT_HEALTH_CHECK, llmChatService.healthCheck.bind(llmChatService));
    rpc.register(RpcMethodEnum.LLMCHAT_READ_FILE_CONTENT, llmChatService.readFileContent.bind(llmChatService));

    const neo4jService = serviceRegistry.get(ServiceEnum.NEO4J);
    rpc.register(RpcMethodEnum.NEO4J_EXECUTE_CYPHER, neo4jService.executeCypher.bind(neo4jService));
    rpc.register(RpcMethodEnum.NEO4J_START_NEO4J_DATABASE, neo4jService.startNeo4jDatabase.bind(neo4jService));
    rpc.register(RpcMethodEnum.NEO4J_STOP_NEO4J_DATABASE, neo4jService.stopNeo4jDatabase.bind(neo4jService));
    rpc.register(RpcMethodEnum.NEO4J_RESTART_NEO4J_DATABASE, neo4jService.restartNeo4jDatabase.bind(neo4jService));

    const vsCodeService = serviceRegistry.get(ServiceEnum.VS_CODE);
    rpc.register(RpcMethodEnum.VSCODE_LOG_MESSAGE, vsCodeService.logMessage.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_GET_EXTENSION_SETTINGS, vsCodeService.getExtensionSettings.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_OPEN_URL, vsCodeService.openUrl.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_OPEN_FILE, vsCodeService.openFile.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_READ_FILE, vsCodeService.readFile.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_REVEAL_IN_EXPLORER, vsCodeService.revealInExplorer.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_COPY_TO_CLIPBOARD, vsCodeService.copyToClipboard.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_SAVE_USER_PREFERENCES, vsCodeService.saveUserPreferences.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_READ_USER_PREFERENCES, vsCodeService.readUserPreferences.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_READ_IMAGE_AS_BASE64, vsCodeService.readImageAsBase64.bind(vsCodeService));
}
