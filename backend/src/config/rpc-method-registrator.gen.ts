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
    const codebaseService = serviceRegistry.get(ServiceEnum.CODEBASE);
    rpc.register(RpcMethodEnum.CODEBASE_GET_CODEBASE, codebaseService.getCodebase.bind(codebaseService));
    rpc.register(RpcMethodEnum.CODEBASE_IMPORT_CODEBASE, codebaseService.importCodebase.bind(codebaseService));
    rpc.register(RpcMethodEnum.CODEBASE_GET_FOLDER_POSITIONS, codebaseService.getFolderPositions.bind(codebaseService));

    const graphRagInstallerService = serviceRegistry.get(ServiceEnum.GRAPH_RAG_INSTALLER);
    rpc.register(RpcMethodEnum.INSTALLER_CHECK_INSTALLATION_STATUS, graphRagInstallerService.checkInstallationStatus.bind(graphRagInstallerService));
    rpc.register(RpcMethodEnum.INSTALLER_UNINSTALL_ALL, graphRagInstallerService.uninstallAll.bind(graphRagInstallerService));

    const vsCodeService = serviceRegistry.get(ServiceEnum.VS_CODE);
    rpc.register(RpcMethodEnum.VSCODE_LOG_MESSAGE, vsCodeService.logMessage.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_GET_EXTENTION_SETTINGS, vsCodeService.getExtentionSettings.bind(vsCodeService));
}
