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

    const blastRadiusErrorFilesIdentificatorService = serviceRegistry.get(ServiceEnum.BLAST_RADIUS_ERROR_FILES_IDENTIFICATOR);
    rpc.register(RpcMethodEnum.BLASTRADIUSERRORFILESIDENTIFICATOR_SEARCH_FILES, blastRadiusErrorFilesIdentificatorService.searchFiles.bind(blastRadiusErrorFilesIdentificatorService));

    const filesExporterHistoryService = serviceRegistry.get(ServiceEnum.FILES_EXPORTER_HISTORY);
    rpc.register(RpcMethodEnum.FEHISTORY_GET_FULL_WRAPPER, filesExporterHistoryService.getFullWrapper.bind(filesExporterHistoryService));
    rpc.register(RpcMethodEnum.FEHISTORY_LOAD_HISTORY, filesExporterHistoryService.loadHistory.bind(filesExporterHistoryService));
    rpc.register(RpcMethodEnum.FEHISTORY_GET_LAST_RUN_CONFIG_ID, filesExporterHistoryService.getLastRunConfigId.bind(filesExporterHistoryService));
    rpc.register(RpcMethodEnum.FEHISTORY_SET_HISTORY_VIEW_MODE, filesExporterHistoryService.setHistoryViewMode.bind(filesExporterHistoryService));
    rpc.register(RpcMethodEnum.FEHISTORY_SAVE_HISTORY, filesExporterHistoryService.saveHistory.bind(filesExporterHistoryService));
    rpc.register(RpcMethodEnum.FEHISTORY_DUPLICATE_ENTRY, filesExporterHistoryService.duplicateEntry.bind(filesExporterHistoryService));
    rpc.register(RpcMethodEnum.FEHISTORY_ADD_NEW_ENTRY, filesExporterHistoryService.addNewEntry.bind(filesExporterHistoryService));
    rpc.register(RpcMethodEnum.FEHISTORY_TOGGLE_FREEZE, filesExporterHistoryService.toggleFreeze.bind(filesExporterHistoryService));
    rpc.register(RpcMethodEnum.FEHISTORY_UPDATE_ENTRY_DISPLAY, filesExporterHistoryService.updateEntryDisplay.bind(filesExporterHistoryService));
    rpc.register(RpcMethodEnum.FEHISTORY_REMOVE_ENTRY, filesExporterHistoryService.removeEntry.bind(filesExporterHistoryService));
    rpc.register(RpcMethodEnum.FEHISTORY_CLEAR_HISTORY, filesExporterHistoryService.clearHistory.bind(filesExporterHistoryService));
    rpc.register(RpcMethodEnum.FEHISTORY_SOFT_CLEAR_HISTORY, filesExporterHistoryService.softClearHistory.bind(filesExporterHistoryService));
    rpc.register(RpcMethodEnum.FEHISTORY_CLEAR_HISTORY_WITH_MODE, filesExporterHistoryService.clearHistoryWithMode.bind(filesExporterHistoryService));
    rpc.register(RpcMethodEnum.FEHISTORY_GET_HISTORY_FILE_PATH, filesExporterHistoryService.getHistoryFilePath.bind(filesExporterHistoryService));
    rpc.register(RpcMethodEnum.FEHISTORY_OPEN_HISTORY_FILE, filesExporterHistoryService.openHistoryFile.bind(filesExporterHistoryService));
    rpc.register(RpcMethodEnum.FEHISTORY_REVEAL_HISTORY_FILE, filesExporterHistoryService.revealHistoryFile.bind(filesExporterHistoryService));

    const filesExporterService = serviceRegistry.get(ServiceEnum.FILES_EXPORTER);
    rpc.register(RpcMethodEnum.FILEEXPORTER_GET_INITIAL_STATE, filesExporterService.getInitialState.bind(filesExporterService));
    rpc.register(RpcMethodEnum.FILEEXPORTER_RUN_EXPORT, filesExporterService.runExport.bind(filesExporterService));
    rpc.register(RpcMethodEnum.FILEEXPORTER_GET_EXPORT_STATUS, filesExporterService.getExportStatus.bind(filesExporterService));
    rpc.register(RpcMethodEnum.FILEEXPORTER_GET_EXPORT_RESULT, filesExporterService.getExportResult.bind(filesExporterService));
    rpc.register(RpcMethodEnum.FILEEXPORTER_KILL_EXPORT, filesExporterService.killExport.bind(filesExporterService));
    rpc.register(RpcMethodEnum.FILEEXPORTER_SIMULATE_FILTERS, filesExporterService.simulateFilters.bind(filesExporterService));
    rpc.register(RpcMethodEnum.FILEEXPORTER_GET_OPEN_EDITOR_FILES, filesExporterService.getOpenEditorFiles.bind(filesExporterService));
    rpc.register(RpcMethodEnum.FILEEXPORTER_GET_GIT_DIFF_FILES, filesExporterService.getGitDiffFiles.bind(filesExporterService));
    rpc.register(RpcMethodEnum.FILEEXPORTER_SYNC_SELECTED_PATHS, filesExporterService.syncSelectedPaths.bind(filesExporterService));
    rpc.register(RpcMethodEnum.FILEEXPORTER_GET_SELECTED_PATHS, filesExporterService.getSelectedPaths.bind(filesExporterService));
    rpc.register(RpcMethodEnum.FILEEXPORTER_CLEAR_SELECTED_PATHS, filesExporterService.clearSelectedPaths.bind(filesExporterService));
    rpc.register(RpcMethodEnum.FILEEXPORTER_OPEN_PATH_AT_CURSOR, filesExporterService.openPathAtCursor.bind(filesExporterService));
    rpc.register(RpcMethodEnum.FILEEXPORTER_COPY_LATEST_EXPORTED_FILES, filesExporterService.copyLatestExportedFiles.bind(filesExporterService));
    rpc.register(RpcMethodEnum.FILEEXPORTER_COPY_SELECTED_FILES_TO_CLIPBOARD, filesExporterService.copySelectedFilesToClipboard.bind(filesExporterService));
    rpc.register(RpcMethodEnum.FILEEXPORTER_CLEAR_DEST_DIRECTORY, filesExporterService.clearDestDirectory.bind(filesExporterService));
    rpc.register(RpcMethodEnum.FILEEXPORTER_APPLY_FILE_FILTER, filesExporterService.applyFileFilter.bind(filesExporterService));
    rpc.register(RpcMethodEnum.FILEEXPORTER_OPEN_BROWSER_TAB, filesExporterService.openBrowserTab.bind(filesExporterService));
    rpc.register(RpcMethodEnum.FILEEXPORTER_SHOW_NOTIFICATION, filesExporterService.showNotification.bind(filesExporterService));

    const fileSystemService = serviceRegistry.get(ServiceEnum.FILE_SYSTEM);
    rpc.register(RpcMethodEnum.FILESYSTEM_EXISTS, fileSystemService.exists.bind(fileSystemService));
    rpc.register(RpcMethodEnum.FILESYSTEM_IS_DIRECTORY, fileSystemService.isDirectory.bind(fileSystemService));
    rpc.register(RpcMethodEnum.FILESYSTEM_CLEAR_DIRECTORY, fileSystemService.clearDirectory.bind(fileSystemService));
    rpc.register(RpcMethodEnum.FILESYSTEM_GET_INVALID_PATHS, fileSystemService.getInvalidPaths.bind(fileSystemService));
    rpc.register(RpcMethodEnum.FILESYSTEM_READ_FILE, fileSystemService.readFile.bind(fileSystemService));
    rpc.register(RpcMethodEnum.FILESYSTEM_WRITE_FILE, fileSystemService.writeFile.bind(fileSystemService));

    const gitService = serviceRegistry.get(ServiceEnum.GIT);
    rpc.register(RpcMethodEnum.GIT_GET_LOCAL_MODIFIED_FILES_FROM_LAST_COMMIT, gitService.getLocalModifiedFilesFromLastCommit.bind(gitService));
    rpc.register(RpcMethodEnum.GIT_GET_LOCAL_MODIFIED_FILES_FROM_REMOTE_BRANCH, gitService.getLocalModifiedFilesFromRemoteBranch.bind(gitService));

    const graphRagExplorerService = serviceRegistry.get(ServiceEnum.GRAPH_RAG_EXPLORER);
    rpc.register(RpcMethodEnum.GRAGEXPLORER_GET_PATHS_CHANGE_IMPACTS, graphRagExplorerService.getPathsChangeImpacts.bind(graphRagExplorerService));

    const graphRagInstallerService = serviceRegistry.get(ServiceEnum.GRAPH_RAG_INSTALLER);
    rpc.register(RpcMethodEnum.GRAGINSTALLER_READ_INSTALLATION_REPORT, graphRagInstallerService.readInstallationReport.bind(graphRagInstallerService));
    rpc.register(RpcMethodEnum.GRAGINSTALLER_UNINSTALL_ALL, graphRagInstallerService.uninstallAll.bind(graphRagInstallerService));

    const imageService = serviceRegistry.get(ServiceEnum.IMAGE);
    rpc.register(RpcMethodEnum.IMAGE_READ_IMAGE_AS_BASE64, imageService.readImageAsBase64.bind(imageService));

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

    const referenceService = serviceRegistry.get(ServiceEnum.REFERENCE);
    rpc.register(RpcMethodEnum.REFERENCE_LOAD_ALL_REFERENCES, referenceService.loadAllReferences.bind(referenceService));
    rpc.register(RpcMethodEnum.REFERENCE_LOAD_REFERENCE_FILES, referenceService.loadReferenceFiles.bind(referenceService));
    rpc.register(RpcMethodEnum.REFERENCE_SAVE, referenceService.save.bind(referenceService));
    rpc.register(RpcMethodEnum.REFERENCE_UPDATE, referenceService.update.bind(referenceService));
    rpc.register(RpcMethodEnum.REFERENCE_DELETE, referenceService.delete.bind(referenceService));

    const sdlcSessionService = serviceRegistry.get(ServiceEnum.SDLC_SESSION);
    rpc.register(RpcMethodEnum.SDLCSESSION_SAVE_SESSION, sdlcSessionService.saveSession.bind(sdlcSessionService));
    rpc.register(RpcMethodEnum.SDLCSESSION_LOAD_ALL_SESSIONS, sdlcSessionService.loadAllSessions.bind(sdlcSessionService));
    rpc.register(RpcMethodEnum.SDLCSESSION_DELETE_SESSION, sdlcSessionService.deleteSession.bind(sdlcSessionService));

    const transformContentService = serviceRegistry.get(ServiceEnum.TRANSFORM_CONTENT);
    rpc.register(RpcMethodEnum.TRANSFORMCONTENT_TRANSFORM, transformContentService.transform.bind(transformContentService));

    const urlService = serviceRegistry.get(ServiceEnum.URL);
    rpc.register(RpcMethodEnum.URL_READ_URL_CONTENT, urlService.readUrlContent.bind(urlService));

    const vsCodeService = serviceRegistry.get(ServiceEnum.VS_CODE);
    rpc.register(RpcMethodEnum.VSCODE_GET_REPO_NAME, vsCodeService.getRepoName.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_GET_WORKSPACE_ROOT_PATH, vsCodeService.getWorkspaceRootPath.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_LOG_MESSAGE, vsCodeService.logMessage.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_GET_EXTENSION_SETTINGS, vsCodeService.getExtensionSettings.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_OPEN_URL, vsCodeService.openUrl.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_OPEN_FILE, vsCodeService.openFile.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_REVEAL_IN_EXPLORER, vsCodeService.revealInExplorer.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_COPY_TO_CLIPBOARD, vsCodeService.copyToClipboard.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_SAVE_USER_PREFERENCES, vsCodeService.saveUserPreferences.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_READ_USER_PREFERENCES, vsCodeService.readUserPreferences.bind(vsCodeService));
}
