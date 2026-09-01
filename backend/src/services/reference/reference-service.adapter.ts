import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logError, logInfo } from '../../utils/utils-log';
import { IReferenceServicePort } from '../../../../shared/services/reference/port-out/reference-service.port';
import { vsCodeSettingsManager } from '../../managers/VsCodeSettings.manager';
import { getWorkspaceExtentionPath, getWorkspaceRoot } from '../../utils/utils-vscode';
import { ReferenceItem, ReferenceFiles, REFERENCES_PROJECT_KEY } from '../../../../shared/services/reference/model/reference-model';
import { REFERENCES_CONFIG_PATH, REFERENCES_CONFIG_FILENAME_PATH, REFERENCES_ORIGINAL_PATH, REFERENCES_TRANSFORMED_PATH, REFERENCES_TEMP_PATH } from '../../config/global-constants';
import { ITransformContentServicePort } from '../../../../shared/services/transform-content/port-out/transform-content-service.port';
import { serviceRegistry } from '../../core/ServiceRegistry';
import { RpcMethodEnum } from '../../../../shared/config/rpc-methods.enum.gen';
import { ServiceEnum } from '../../../../shared/config/service-enum.gen';
import { IUrlServicePort } from '../../../../shared/services/url/port-out/url-service.port';
import { IFileSystemServicePort } from '../../../../shared/services/file-system/port-out/file-system-service.port';
import { IVsCodeServicePort } from '../../../../shared/services/vscode/port-out/vscode-service.port';

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

    private readYamlStore(): Record<string, ReferenceItem[]> {
        const filePath = REFERENCES_CONFIG_FILENAME_PATH;
        try {
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const parsed = yaml.load(fileContent);

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
        const filePath = REFERENCES_CONFIG_FILENAME_PATH;
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

    public async loadReferenceFiles(id: string): Promise<ReferenceFiles> {
        const originalPath = path.join(REFERENCES_ORIGINAL_PATH, `${id}.txt`);
        const transformedPath = path.join(REFERENCES_TRANSFORMED_PATH, `${id}.txt`);
        const tempPath = path.join(REFERENCES_TEMP_PATH, `${id}.txt`);

        let originalContent = '';
        if (await this.getFileSystemService().exists(originalPath)) {
            originalContent = (await this.getFileSystemService().readFile(originalPath)) || '';
        }

        let transformedContent: string | undefined = undefined;
        if (await this.getFileSystemService().exists(transformedPath)) {
            transformedContent = await this.getFileSystemService().readFile(transformedPath);
        }

        let tempContent: string | undefined = undefined;
        if (await this.getFileSystemService().exists(tempPath)) {
            tempContent = await this.getFileSystemService().readFile(tempPath);
        }

        return {
            originalContent,
            transformedContent,
            tempContent,
        };
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

    public async save(storageKey: string = REFERENCES_PROJECT_KEY, reference: ReferenceItem, initialContent?: string): Promise<ReferenceItem> {
        const store = this.readYamlStore();
        const list = store[storageKey] || [];
        const existingIndex = list.findIndex((r) => r.id === reference.id);

        const originalStoragePath = path.join(REFERENCES_ORIGINAL_PATH, `${reference.id}.txt`);

        // If initialContent is explicitly provided, save it to original storage
        if (initialContent !== undefined) {
            await this.getFileSystemService().writeFile(originalStoragePath, initialContent);
            reference.sizeKb = Number((Buffer.byteLength(initialContent, 'utf8') / 1024).toFixed(2));
        } else if (!(await this.getFileSystemService().exists(originalStoragePath)) && reference.url) {
            // Fetch from URL if original file does not exist yet
            try {
                const fetched = await this.getUrlService().readUrlContent(reference.url);
                if (fetched && !fetched.includes('URL cannot be read')) {
                    await this.getFileSystemService().writeFile(originalStoragePath, fetched);
                    reference.sizeKb = Number((Buffer.byteLength(fetched, 'utf8') / 1024).toFixed(2));
                }
            } catch (err) {
                logError(`[ReferenceServiceAdapter] Failed to fetch URL content for ${reference.id}:`, err);
            }
        }

        // Read original file to run transformation and update size metrics
        let originalContent = '';
        if (await this.getFileSystemService().exists(originalStoragePath)) {
            originalContent = (await this.getFileSystemService().readFile(originalStoragePath)) || '';
            reference.sizeKb = Number((Buffer.byteLength(originalContent, 'utf8') / 1024).toFixed(2));
        }

        // Run transformation and save to transformed folder if transformer workflow is assigned
        if (reference.transformer && originalContent) {
            try {
                const transformerService = this.getTransformerService();
                const transformationResult = await transformerService.transform(reference.transformer, originalContent);
                const transformedContent = transformationResult.renderedOutput || transformationResult.content || '';

                reference.sizeKbAfterTransformation = Number((Buffer.byteLength(transformedContent, 'utf8') / 1024).toFixed(2));

                const transformedStoragePath = path.join(REFERENCES_TRANSFORMED_PATH, `${reference.id}.txt`);
                await this.getFileSystemService().writeFile(transformedStoragePath, transformedContent);
                logInfo(`[ReferenceServiceAdapter] Saved transformed content to local path: ${transformedStoragePath}`);
            } catch (error) {
                logError(`[ReferenceServiceAdapter] Transformation execution failed for reference ID ${reference.id}:`, error);
            }
        }

        // Clean up legacy content properties from YAML object
        delete (reference as any).content;
        delete (reference as any).contentAfterTransformation;

        if (existingIndex !== -1) {
            list[existingIndex] = reference;
        } else {
            list.push(reference);
        }

        store[storageKey] = list;
        this.writeYamlStore(store);

        return reference;
    }

    public dispose() {
        // Disposable cleanup if needed
    }
}
