// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { INeo4jServicePort } from '@/shared/services/neo4j/port-out/neo4j-service.port';

class Neo4jApiService extends AbstractApiService implements INeo4jServicePort {
    constructor() {
        super();
    }

    public async executeCypher(query: string, params?: Record<string, any>): Promise<any> {
        return await this.rpc.call(RpcMethodEnum.NEO4J_EXECUTE_CYPHER, query, params);
    }

    public async startNeo4jDatabase(): Promise<boolean> {
        return await this.rpc.call(RpcMethodEnum.NEO4J_START_NEO4J_DATABASE);
    }

    public async stopNeo4jDatabase(): Promise<boolean> {
        return await this.rpc.call(RpcMethodEnum.NEO4J_STOP_NEO4J_DATABASE);
    }

    public async restartNeo4jDatabase(): Promise<boolean> {
        return await this.rpc.call(RpcMethodEnum.NEO4J_RESTART_NEO4J_DATABASE);
    }
}

export const neo4jApiService = new Neo4jApiService();
