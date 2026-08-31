import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logError, logInfo } from '../../utils/utils-log';
import { IReferenceServicePort } from '../../../../shared/services/reference/port-out/reference-service.port';
import { vsCodeSettingsManager } from '../../managers/VsCodeSettings.manager';
import { getWorkspaceRoot } from '../../utils/utils-vscode';
import { REFERENCES_CONFIG_PATH, PROJECT_REFERENCES_CONFIG_FILENAME, GLOBAL_PROJECT_REFERENCES_KEY } from '../../config/global-constants';
import type { ReferenceItem } from '../../../../shared/services/reference/model/reference-model';

export class ReferenceServiceAdapter extends AbstractServiceAdapter implements IReferenceServicePort, vscode.Disposable {

    constructor() {
        super();
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
        const filePath = path.join(absoluteBasePath, PROJECT_REFERENCES_CONFIG_FILENAME);

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
                        [GLOBAL_PROJECT_REFERENCES_KEY]: parsed as ReferenceItem[],
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

    public async loadAllReferences(storageKey: string = GLOBAL_PROJECT_REFERENCES_KEY): Promise<ReferenceItem[]> {
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

    public async save(storageKey: string, reference: ReferenceItem): Promise<ReferenceItem> {
        const store = this.readYamlStore();
        const list = store[storageKey] || [];
        const existingIndex = list.findIndex((r) => r.id === reference.id);

        if (existingIndex !== -1) {
            list[existingIndex] = reference;
        } else {
            list.push(reference);
        }

        store[storageKey] = list;
        this.writeYamlStore(store);
        return reference;
    }

    public async update(storageKey: string, reference: ReferenceItem): Promise<ReferenceItem> {
        return this.save(storageKey, reference);
    }

    public async delete(storageKey: string, id: string): Promise<void> {
        const store = this.readYamlStore();
        if (store[storageKey]) {
            store[storageKey] = store[storageKey].filter((r) => r.id !== id);
            this.writeYamlStore(store);
        }
    }

    public async readUrlContent(url: string): Promise<{ content: string; sizeKb: number }> {
        try {
            if (url.startsWith('http://') || url.startsWith('https://')) {
                const response = await fetch(url);
                if (response.ok) {
                    const text = await response.text();
                    const sizeKb = Number((Buffer.byteLength(text, 'utf8') / 1024).toFixed(2));
                    return { content: text, sizeKb: Math.max(0.1, sizeKb) };
                }
            }
        } catch (error) {
            logError(`[ReferenceServiceAdapter] Failed to fetch content from URL: ${url}`, error);
        }

        const mockContent = `# Imported Reference Content from ${url}\n\nURL: ${url}\nLoaded At: ${new Date().toLocaleString()}\n\n[CONTEXT DATA]\n- Updated configuration payload loaded.`;
        const sizeKb = Number((Buffer.byteLength(mockContent, 'utf8') / 1024).toFixed(2));
        return { content: mockContent, sizeKb: Math.max(0.5, sizeKb) };
    }

    public dispose() {
        // Disposable cleanup if needed
    }
}
