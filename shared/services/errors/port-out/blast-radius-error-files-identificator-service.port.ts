import { BlastRadiusScope } from "../types/type-blast-radius-scope";

export interface IBlastRadiusErrorFilesIdentificatorServicePort {
    searchFiles(scope: BlastRadiusScope, content: string, workspaceRoot: string, onStderr?: (data: string) => void, includeOutWorkspace?: boolean): Promise<string[]>;
}
