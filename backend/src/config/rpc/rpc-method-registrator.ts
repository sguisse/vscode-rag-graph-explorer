import { serviceRegistry } from '../../core/ServiceRegistry';
import { ServiceEnum } from '../../../../shared/config/service-enum';
import { RpcMethodEnum } from '../../../../shared/config/rpc-methods.enum';
import { RpcProtocol } from '../../../../shared/rpc/rpc-protocol';

/**
 * Resolves services from the ServiceRegistry and registers all RPC protocol handlers.
 */
export function registerRpcMethods(rpc: RpcProtocol): void {
    const vscodeService = serviceRegistry.get(ServiceEnum.VS_CODE);
    rpc.register(RpcMethodEnum.VSCODE_LOG_MESSAGE, vscodeService.logMessage.bind(vscodeService));
    rpc.register(RpcMethodEnum.VSCODE_GET_EXTENTION_SETTINGS, vscodeService.getExtentionSettings.bind(vscodeService));
}
