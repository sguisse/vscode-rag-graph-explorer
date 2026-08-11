// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { CodebaseData } from '@/shared/services/graph-rag-explorer/domain/model/codebase.model';
import { INeo4jServicePort } from '@/shared/services/graph-rag-explorer/domain/port-out/neo4j-service.port';

class Neo4jApiService extends AbstractApiService implements INeo4jServicePort {
    constructor() {
        super();
    }

    public async executeCypher(query: string, params?: Record<string, any>): Promise<any> {
        return await this.rpc.call(RpcMethodEnum.NEO4J_EXECUTE_CYPHER, query, params);
    }

    public async getPathsChangeImpacts(paths: string[], maxDepth: number): Promise<CodebaseData> {
        return await this.rpc.call(RpcMethodEnum.NEO4J_GET_PATHS_CHANGE_IMPACTS, paths, maxDepth);
    }
}

export const neo4jApiService = new Neo4jApiService();
