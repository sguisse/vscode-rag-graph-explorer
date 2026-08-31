// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { CodebaseData } from '@/shared/services/graph-rag-explorer/model/codebase.model';
import { IGraphRagExplorerServicePort } from '@/shared/services/graph-rag-explorer/port-out/grag-explorer-service.port';

class GraphRagExplorerApiService extends AbstractApiService implements IGraphRagExplorerServicePort {
    constructor() {
        super();
    }

    public async getPathsChangeImpacts(paths: string[], upstreamDepth: number, downstreamDepth: number): Promise<CodebaseData> {
        return await this.rpc.call(RpcMethodEnum.GRAGEXPLORER_GET_PATHS_CHANGE_IMPACTS, paths, upstreamDepth, downstreamDepth);
    }
}

export const graphRagExplorerApiService = new GraphRagExplorerApiService();
