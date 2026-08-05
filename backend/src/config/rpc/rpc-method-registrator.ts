import { serviceRegistry } from '../../core/ServiceRegistry';
import { ServiceEnum } from '../../../../shared/config/service-enum';
import { RpcMethodEnum } from '../../../../shared/config/rpc-methods.enum';
import { RpcProtocol } from '../../../../shared/rpc/rpc-protocol';

/**
 * Resolves services from the ServiceRegistry and registers all RPC protocol handlers.
 */
export function registerRpcMethods(rpc: RpcProtocol): void {
    const loggerService = serviceRegistry.get(ServiceEnum.LOGGER);
    rpc.register(RpcMethodEnum.LOG_MESSAGE, loggerService.logMessage.bind(loggerService));
}
