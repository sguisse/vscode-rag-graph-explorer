// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { GitDiffResult } from '@/shared/services/git/domain/model/git-model';
import { IGitServicePort } from '@/shared/services/git/domain/model/port-out/git-service.port';

class GitApiService extends AbstractApiService implements IGitServicePort {
    constructor() {
        super();
    }

    public async getLocalModifiedFilesFromLastCommit(wsPath: string): Promise<GitDiffResult> {
        return await this.rpc.call(RpcMethodEnum.GIT_GET_LOCAL_MODIFIED_FILES_FROM_LAST_COMMIT, wsPath);
    }

    public async getLocalModifiedFilesFromRemoteBranch(wsPath: string): Promise<GitDiffResult> {
        return await this.rpc.call(RpcMethodEnum.GIT_GET_LOCAL_MODIFIED_FILES_FROM_REMOTE_BRANCH, wsPath);
    }
}

export const gitApiService = new GitApiService();
