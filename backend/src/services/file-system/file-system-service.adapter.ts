import * as vscode from 'vscode';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logInfo, logWarn } from '../../utils/utils-log';
import { IFileSystemServicePort } from '../../../../shared/services/file-system/port-out/file-system-service.port';

export class FileSystemAdapter extends AbstractServiceAdapter implements IFileSystemServicePort, vscode.Disposable {

    constructor () {
        super()
    }

    public async exists(fsPath: string): Promise<boolean> {
        return fs.existsSync(fsPath);
    }

    public async isDirectory(fsPath: string): Promise<boolean> {
        try {
            return fs.statSync(fsPath).isDirectory();
        } catch {
            return false;
        }
    }

    public async clearDirectory(dirPath: string): Promise<void> {
        if (!fs.existsSync(dirPath)) return;
        const files = await fsPromises.readdir(dirPath);
        for (const file of files) {
            await fsPromises.rm(path.join(dirPath, file), { recursive: true, force: true });
        }
    }

    public async getInvalidPaths(paths: string[], workspaceRoot: string): Promise<string[]> {
        const invalidPaths: string[] = [];
        for (const rawPath of paths) {
            let cleanPath = rawPath.replace(/^['"]|['"]$/g, '').trim();
            if (!cleanPath) continue;
            if (!path.isAbsolute(cleanPath)) {
                cleanPath = path.join(workspaceRoot, cleanPath);
            }
            if (!fs.existsSync(cleanPath)) {
                invalidPaths.push(rawPath);
            }
        }
        return invalidPaths;
    }

    public async readFile(filePath: string): Promise<string | undefined> {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf-8');
        } else {
            logWarn(`[FileSystemAdapter] File does not exist: ${filePath}`);
            return undefined;
        }
    }


    public async writeFile(filePath: string, content: string): Promise<void> {
        const dir = path.dirname(filePath);
        await fsPromises.mkdir(dir, { recursive: true });
        await fsPromises.writeFile(filePath, content, 'utf-8');
    }



    public dispose() {

    }
}
