// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { IFileSystemServicePort } from '@/shared/services/file-system/model/port-out/file-system-service.port';

class FileSystemApiService extends AbstractApiService implements IFileSystemServicePort {
    constructor() {
        super();
    }

    public async exists(fsPath: string): Promise<boolean> {
        return await this.rpc.call(RpcMethodEnum.FILESYSTEM_EXISTS, fsPath);
    }

    public async isDirectory(fsPath: string): Promise<boolean> {
        return await this.rpc.call(RpcMethodEnum.FILESYSTEM_IS_DIRECTORY, fsPath);
    }

    public async clearDirectory(dirPath: string): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.FILESYSTEM_CLEAR_DIRECTORY, dirPath);
    }

    public async getInvalidPaths(paths: string[], workspaceRoot: string): Promise<string[]> {
        return await this.rpc.call(RpcMethodEnum.FILESYSTEM_GET_INVALID_PATHS, paths, workspaceRoot);
    }

    public async readFile(filePath: string): Promise<string | undefined> {
        return await this.rpc.call(RpcMethodEnum.FILESYSTEM_READ_FILE, filePath);
    }
}

export const fileSystemApiService = new FileSystemApiService();
