// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { BlastRadiusScope } from '@/shared/services/errors/domain/model/types/type-blast-radius-scope';
import { IBlastRadiusErrorFilesIdentificatorServicePort } from '@/shared/services/errors/domain/model/port-out/blast-radius-error-files-identificator-service.port';

class BlastRadiusErrorFilesIdentificatorApiService extends AbstractApiService implements IBlastRadiusErrorFilesIdentificatorServicePort {
    constructor() {
        super();
    }

    public async searchFiles(scope: BlastRadiusScope, content: string, workspaceRoot: string, onStderr?: (data: string) => void, includeOutWorkspace?: boolean): Promise<string[]> {
        return await this.rpc.call(RpcMethodEnum.BLASTRADIUSERRORFILESIDENTIFICATOR_SEARCH_FILES, scope, content, workspaceRoot, onStderr);
    }
}

export const blastRadiusErrorFilesIdentificatorApiService = new BlastRadiusErrorFilesIdentificatorApiService();
