// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { IGraphRagInstallerServicePort } from '@/shared/services/graph-rag-explorer/domain/port-out/installer-service.port';

class GraphRagInstallerApiService extends AbstractApiService implements IGraphRagInstallerServicePort {
    constructor() {
        super();
    }

    public async checkInstallationStatus(): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.INSTALLER_CHECK_INSTALLATION_STATUS);
    }

    public async uninstallAll(): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.INSTALLER_UNINSTALL_ALL);
    }
}

export const graphRagInstallerApiService = new GraphRagInstallerApiService();
