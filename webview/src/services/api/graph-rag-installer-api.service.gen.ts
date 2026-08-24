// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { FinalInstallStatusReport } from '@/shared/services/graph-rag-explorer/domain/model/install-result.model';
import { IGraphRagInstallerServicePort } from '@/shared/services/graph-rag-explorer/domain/port-out/grag-installer-service.port';

class GraphRagInstallerApiService extends AbstractApiService implements IGraphRagInstallerServicePort {
    constructor() {
        super();
    }

    public async readInstallationReport(): Promise<FinalInstallStatusReport> {
        return await this.rpc.call(RpcMethodEnum.GRAGINSTALLER_READ_INSTALLATION_REPORT);
    }

    public async uninstallAll(): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.GRAGINSTALLER_UNINSTALL_ALL);
    }
}

export const graphRagInstallerApiService = new GraphRagInstallerApiService();
