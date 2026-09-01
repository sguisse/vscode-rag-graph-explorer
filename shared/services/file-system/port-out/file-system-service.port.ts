export interface IFileSystemServicePort {
  exists(fsPath: string): Promise<boolean>;
  isDirectory(fsPath: string): Promise<boolean>;
  clearDirectory(dirPath: string): Promise<void>;
  getInvalidPaths(paths: string[], workspaceRoot: string): Promise<string[]>;
  readFile(filePath: string): Promise<string | undefined>;
  writeFile(filePath: string, content: string): Promise<void>;
}
