// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { CodebaseData, CodebaseFile, Dependency, ImpactDirection, SelectedEntity } from '@/shared/services/graph-rag-explorer/domain/model/codebase.model';
import { INeo4jServicePort } from '@/shared/services/graph-rag-explorer/domain/port-out/neo4j-service.port';

class Neo4jApiService extends AbstractApiService implements INeo4jServicePort {
    constructor() {
        super();
    }


}

export const neo4jApiService = new Neo4jApiService();
