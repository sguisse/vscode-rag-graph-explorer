import type { GitDiffResult } from '../model/git-model';

export interface IGitServicePort {
    getLocalModifiedFilesFromLastCommit(wsPath: string): Promise<GitDiffResult>;
    getLocalModifiedFilesFromRemoteBranch(wsPath: string): Promise<GitDiffResult>;
}
