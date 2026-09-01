import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logError, logInfo } from '../../utils/utils-log';
import { IReferenceServicePort } from '../../../../shared/services/reference/port-out/reference-service.port';
import { vsCodeSettingsManager } from '../../managers/VsCodeSettings.manager';
import { getWorkspaceRoot } from '../../utils/utils-vscode';
import { ReferenceItem, REFERENCES_PROJECT_KEY } from '../../../../shared/services/reference/model/reference-model';
import { REFERENCES_CONFIG_FILENAME, REFERENCES_CONFIG_PATH } from '../../config/global-constants';
import { ITransformContentServicePort } from '../../../../shared/services/transform-content/port-out/transform-content-service.port';
import { serviceRegistry } from '../../core/ServiceRegistry';
import { RpcMethodEnum } from '../../../../shared/config/rpc-methods.enum.gen';
import { ServiceEnum } from '../../../../shared/config/service-enum.gen';
import { IUrlServicePort } from '../../../../shared/services/url/port-out/url-service.port';
import { IFileSystemServicePort } from '../../../../shared/services/file-system/port-out/file-system-service.port';

export class ReferenceServiceAdapter extends AbstractServiceAdapter implements IReferenceServicePort, vscode.Disposable {

    constructor() {
        super();

    }

    private getTransformerService(): ITransformContentServicePort {
        const transformerService = serviceRegistry.get(ServiceEnum.TRANSFORM_CONTENT);
        if (!transformerService) {
            throw new Error('TransformContentService is not available. Ensure it is initialized before use.');
        }
        return transformerService;
    }

    private getUrlService(): IUrlServicePort {
        const urlService = serviceRegistry.get(ServiceEnum.URL);
        if (!urlService) {
            throw new Error('UrlService is not available. Ensure it is initialized before use.');
        }
        return urlService;
    }

    private getFileSystemService(): IFileSystemServicePort {
        const fileSystemService = serviceRegistry.get(ServiceEnum.FILE_SYSTEM);
        if (!fileSystemService) {
            throw new Error('FileSystemService is not available. Ensure it is initialized before use.');
        }
        return fileSystemService;
    }

    private buildReferencesFilePath(): string {
        logInfo(`[ReferenceServiceAdapter] buildReferencesFilePath start ...`);

        // 1. Resolve VS Code workspace root directory
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const rootPath = workspaceFolders && workspaceFolders.length > 0
            ? workspaceFolders[0].uri.fsPath
            : getWorkspaceRoot();

        // 2. Convert relative path (e.g. '.token-razor') to absolute path
        const absoluteBasePath = path.isAbsolute(REFERENCES_CONFIG_PATH)
            ? REFERENCES_CONFIG_PATH
            : path.resolve(rootPath, REFERENCES_CONFIG_PATH);

        // 3. Construct absolute path to project-references.yaml
        const filePath = path.join(absoluteBasePath, REFERENCES_CONFIG_FILENAME);

        logInfo(`[ReferenceServiceAdapter] Using project references file path: ${filePath}`);
        return filePath;
    }


    private readYamlStore(): Record<string, ReferenceItem[]> {
        const filePath = this.buildReferencesFilePath();
        try {
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const parsed = yaml.load(fileContent);

                // Convert top-level array to keyed store object
                if (Array.isArray(parsed)) {
                    return {
                        [REFERENCES_PROJECT_KEY]: parsed as ReferenceItem[],
                    };
                }

                if (parsed && typeof parsed === 'object') {
                    return parsed as Record<string, ReferenceItem[]>;
                }
            }
        } catch (error) {
            logError(`[ReferenceServiceAdapter] Failed to read YAML from ${filePath}:`, error);
        }
        return {};
    }


    private writeYamlStore(store: Record<string, ReferenceItem[]>): void {
        const filePath = this.buildReferencesFilePath();
        try {
            const dirPath = path.dirname(filePath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            const yamlContent = yaml.dump(store, { indent: 2 });
            fs.writeFileSync(filePath, yamlContent, 'utf8');
            logInfo(`[ReferenceServiceAdapter] Successfully saved project references to ${filePath}`);
        } catch (error) {
            logError(`[ReferenceServiceAdapter] Failed to write YAML to ${filePath}:`, error);
        }
    }

    public async loadAllReferences(storageKey: string = REFERENCES_PROJECT_KEY): Promise<ReferenceItem[]> {
        logInfo(`[ReferenceServiceAdapter] Loading all references for storageKey: ${storageKey}`);
        const store = this.readYamlStore();

        let references: ReferenceItem[] = [];

        if (!storageKey) {
            references = Object.values(store).flat();
            // Deduplicate items by ID if multiple keys contain the same array
            const seen = new Set<string>();
            references = references.filter(r => {
                if (seen.has(r.id)) return false;
                seen.add(r.id);
                return true;
            });
        } else {
            references = store[storageKey] || [];
        }

        logInfo(`[ReferenceServiceAdapter] Loaded ${references.length} reference(s) for storageKey '${storageKey}'`);
        return references;
    }


    public async update(storageKey: string = REFERENCES_PROJECT_KEY, reference: ReferenceItem): Promise<ReferenceItem> {
        return this.save(storageKey, reference);
    }

    public async delete(storageKey: string = REFERENCES_PROJECT_KEY, id: string): Promise<void> {
        const store = this.readYamlStore();
        if (store[storageKey]) {
            store[storageKey] = store[storageKey].filter((r) => r.id !== id);
            this.writeYamlStore(store);
        }
    }

    public async save(storageKey: string = REFERENCES_PROJECT_KEY, reference: ReferenceItem): Promise<ReferenceItem> {
        const store = this.readYamlStore();
        const list = store[storageKey] || [];
        const existingIndex = list.findIndex((r) => r.id === reference.id);

        if (existingIndex !== -1) {
            list[existingIndex] = reference;
        } else {
            list.push(reference);
        }

        // Read the URL content to store in local folder
        const referenceContent = await this.getUrlService().readUrlContent(reference.url);
        // Write the content to the local file system and update the reference item with the local path
        const referenceStoragePath = path.join(REFERENCES_CONFIG_PATH, `${reference.id}.txt`);
        await this.getFileSystemService().writeFile(referenceStoragePath, referenceContent);

        store[storageKey] = list;
        this.writeYamlStore(store);

        /*
        if (reference.transformer && reference.content) {
            const transformerService = this.getTransformerService();
            try {
                const transformationResult = await transformerService.transform(reference.transformer, reference.content);
                reference.contentAfterTransformation = transformationResult.transformedContent;
                reference.sizeKbAfterTransformation = Number((Buffer.byteLength(transformationResult.transformedContent, 'utf8') / 1024).toFixed(2));
                logInfo(`[ReferenceServiceAdapter] Transformation applied for reference ID: ${reference.id}`);
            }
            */

        return reference;
    }

    public dispose() {
        // Disposable cleanup if needed
    }
}
