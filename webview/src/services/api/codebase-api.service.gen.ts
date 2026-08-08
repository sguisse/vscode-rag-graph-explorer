// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { CodebaseData, CodebaseFile, Dependency, ImpactDirection, SelectedEntity } from '@/shared/services/graph-rag-explorer/domain/model/codebase.model';
import { ICodebaseServicePort } from '@/shared/services/graph-rag-explorer/domain/port-out/codebase-service.port';

class CodebaseApiService extends AbstractApiService implements ICodebaseServicePort {
    constructor() {
        super();
    }

    public async getCodebase(): Promise<CodebaseData> {
        return await this.rpc.call(RpcMethodEnum.CODEBASE_GET_CODEBASE);
    }

    public async importCodebase(data: CodebaseData): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.CODEBASE_IMPORT_CODEBASE, data);
    }

    public async getFolderPositions(): Promise<Record<string, { label: string }>> {
        return await this.rpc.call(RpcMethodEnum.CODEBASE_GET_FOLDER_POSITIONS);
    }
}

export const codebaseApiService = new CodebaseApiService();
