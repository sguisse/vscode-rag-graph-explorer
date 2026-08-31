import type { GitDiffResult } from '../git-model';

export interface IGitServicePort {
    getLocalModifiedFilesFromLastCommit(wsPath: string): Promise<GitDiffResult>;
    getLocalModifiedFilesFromRemoteBranch(wsPath: string): Promise<GitDiffResult>;
}
