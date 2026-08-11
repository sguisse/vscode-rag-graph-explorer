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
    const graphRagInstallerService = serviceRegistry.get(ServiceEnum.GRAPH_RAG_INSTALLER);
    rpc.register(RpcMethodEnum.INSTALLER_CHECK_INSTALLATION_STATUS, graphRagInstallerService.checkInstallationStatus.bind(graphRagInstallerService));
    rpc.register(RpcMethodEnum.INSTALLER_UNINSTALL_ALL, graphRagInstallerService.uninstallAll.bind(graphRagInstallerService));

    const neo4jService = serviceRegistry.get(ServiceEnum.NEO4J);
    rpc.register(RpcMethodEnum.NEO4J_EXECUTE_CYPHER, neo4jService.executeCypher.bind(neo4jService));
    rpc.register(RpcMethodEnum.NEO4J_GET_PATHS_CHANGE_IMPACTS, neo4jService.getPathsChangeImpacts.bind(neo4jService));

    const vsCodeService = serviceRegistry.get(ServiceEnum.VS_CODE);
    rpc.register(RpcMethodEnum.VSCODE_LOG_MESSAGE, vsCodeService.logMessage.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_GET_EXTENSION_SETTINGS, vsCodeService.getExtensionSettings.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_OPEN_URL, vsCodeService.openUrl.bind(vsCodeService));
    rpc.register(RpcMethodEnum.VSCODE_REVEAL_IN_EXPLORER, vsCodeService.revealInExplorer.bind(vsCodeService));
}
