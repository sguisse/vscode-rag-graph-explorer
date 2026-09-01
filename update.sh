#!/usr/bin/env bash
set -e

# Ensure all target directories exist
mkdir -p shared/services/reference/model
mkdir -p shared/services/reference/port-out
mkdir -p webview/src/services/api
mkdir -p backend/src/services/reference
mkdir -p webview/src/features/transformer/hooks
mkdir -p webview/src/components/app/project-references/hooks
mkdir -p webview/src/components/app/project-references/components

# 1. Update shared/services/reference/model/reference-model.ts
cat << 'EOF' > shared/services/reference/model/reference-model.ts
import { TransformerWorkflow } from "../../transform-content/model/transform-content-model";

export const REFERENCES_PROJECT_KEY = 'global-project-references';

export interface ReferenceItem {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: string;
  url: string;
  preSelected: boolean; // If user resets selection, if true it will be selected again
  sizeKb: number;
  addedAt?: string;
  updatedAt?: string;
  changeDetected?: number; // Expressed in % vs actual version
  transformer?: TransformerWorkflow;
  sizeKbAfterTransformation?: number;
}

export interface ReferenceFiles {
  originalContent: string;
  transformedContent?: string;
  tempContent?: string;
}
EOF

# 2. Update shared/services/reference/port-out/reference-service.port.ts
cat << 'EOF' > shared/services/reference/port-out/reference-service.port.ts
import { ReferenceItem, ReferenceFiles } from '../model/reference-model';

export interface IReferenceServicePort {
    loadAllReferences(storageKey?: string): Promise<ReferenceItem[]>;
    loadReferenceFiles(id: string): Promise<ReferenceFiles>;
    save(storageKey: string, reference: ReferenceItem, initialContent?: string): Promise<ReferenceItem>;
    update(storageKey: string, reference: ReferenceItem): Promise<ReferenceItem>;
    delete(storageKey: string, id: string): Promise<void>;
}
EOF

# 3. Update webview/src/services/api/reference-api.service.gen.ts
cat << 'EOF' > webview/src/services/api/reference-api.service.gen.ts
// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { ReferenceItem, ReferenceFiles } from '@/shared/services/reference/model/reference-model';
import { IReferenceServicePort } from '@/shared/services/reference/port-out/reference-service.port';

class ReferenceApiService extends AbstractApiService implements IReferenceServicePort {
    constructor() {
        super();
    }

    public async loadAllReferences(storageKey?: string): Promise<ReferenceItem[]> {
        return await this.rpc.call(RpcMethodEnum.REFERENCE_LOAD_ALL_REFERENCES, storageKey);
    }

    public async loadReferenceFiles(id: string): Promise<ReferenceFiles> {
        return await this.rpc.call((RpcMethodEnum as any).REFERENCE_LOAD_REFERENCE_FILES || 'reference.loadReferenceFiles', id);
    }

    public async save(storageKey: string, reference: ReferenceItem, initialContent?: string): Promise<ReferenceItem> {
        return await this.rpc.call(RpcMethodEnum.REFERENCE_SAVE, storageKey, reference, initialContent);
    }

    public async update(storageKey: string, reference: ReferenceItem): Promise<ReferenceItem> {
        return await this.rpc.call(RpcMethodEnum.REFERENCE_UPDATE, storageKey, reference);
    }

    public async delete(storageKey: string, id: string): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.REFERENCE_DELETE, storageKey, id);
    }
}

export const referenceApiService = new ReferenceApiService();
EOF

# 4. Update backend/src/services/reference/reference-service.adapter.ts
cat << 'EOF' > backend/src/services/reference/reference-service.adapter.ts
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
EOF

# 5. Update webview/src/features/transformer/hooks/use-transformer.ts
cat << 'EOF' > webview/src/features/transformer/hooks/use-transformer.ts
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

import { useTransformationScope, UseTransformationScopeOptions } from './use-transformation-scope';
import { transformContentApiService } from '@/services/api/transform-content-api.service.gen';
import { referenceApiService } from '@/services/api/reference-api.service.gen';
import {
  DEFAULT_WORKFLOW_JSON,
  TransformerWorkflow,
  TransformationResult
} from '@/shared/services/transform-content/model/transform-content-model';
import { ReferenceItem, REFERENCES_PROJECT_KEY } from '@/shared/services/reference/model/reference-model';

export function useTransformer(options?: UseTransformationScopeOptions & {
  initialWorkflow?: TransformerWorkflow;
  onSaveWorkflow?: (workflow: TransformerWorkflow) => void;
  onCloseFeature?: () => void;
}) {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const { scope, setScope, referenceFileInfo } = useTransformationScope(options);

  const [initialWorkflowJson, setInitialWorkflowJson] = useState<string>(() =>
    JSON.stringify(options?.initialWorkflow || DEFAULT_WORKFLOW_JSON, null, 2)
  );

  const [workflowJsonText, setWorkflowJsonText] = useState<string>(initialWorkflowJson);
  const [inputText, setInputText] = useState<string>('');

  const [workflowParseError, setWorkflowJsonError] = useState<string | null>(null);
  const [templateCursorPos, setTemplateCursorPos] = useState<number | null>(null);

  const [pipelineResult, setPipelineResult] = useState<TransformationResult>({
    content: '',
    sizeKb: 0,
    anonymizedText: '',
    extractedData: {},
    records: [],
    renderedOutput: '',
    metrics: {
      executionTimeMs: 0,
      inputBytes: 0,
      outputBytes: 0,
      totalMatches: 0,
      logs: [],
    },
  });

  // Fetch local file content via ReferenceFiles on demand for reference item
  useEffect(() => {
    if (referenceFileInfo?.referenceId) {
      Promise.all([
        referenceApiService.loadAllReferences(REFERENCES_PROJECT_KEY),
        referenceApiService.loadReferenceFiles(referenceFileInfo.referenceId),
      ]).then(([refs, files]) => {
        const targetRef = refs.find((r) => r.id === referenceFileInfo.referenceId);
        if (files?.originalContent) {
          setInputText(files.originalContent);
        }
        if (targetRef?.transformer) {
          const wfStr = JSON.stringify(targetRef.transformer, null, 2);
          setInitialWorkflowJson(wfStr);
          setWorkflowJsonText(wfStr);
        }
      }).catch((err) => {
        console.error('[useTransformer] Failed to load reference item content:', err);
      });
    } else {
      setInputText(
        `<html>\n  <head>\n    <title>Sample Web Scraping Target</title>\n    <meta name="description" content="Extracting unstructured data into JSON payload.">\n  </head>\n  <body>\n    <h1>Contact Us</h1>\n    <p>Email: admin@example.com, Server IP: 192.168.1.50</p>\n  </body>\n</html>`
      );
    }
  }, [referenceFileInfo?.referenceId]);

  const isDirty = useMemo(() => {
    return workflowJsonText.trim() !== initialWorkflowJson.trim();
  }, [workflowJsonText, initialWorkflowJson]);

  const parsedWorkflow = useMemo<TransformerWorkflow>(() => {
    try {
      const parsed = JSON.parse(workflowJsonText);
      setWorkflowJsonError(null);
      return parsed;
    } catch (err: any) {
      setWorkflowJsonError(`JSON Syntax Error: ${err.message}`);
      return DEFAULT_WORKFLOW_JSON;
    }
  }, [workflowJsonText]);

  useEffect(() => {
    let isMounted = true;
    transformContentApiService
      .transform(parsedWorkflow, inputText)
      .then((result) => {
        if (isMounted && result) {
          setPipelineResult(result);
        }
      })
      .catch((err) => {
        console.error('Error executing transformation pipeline via service:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [inputText, parsedWorkflow]);

  const handleCopyOutput = useCallback(() => {
    navigator.clipboard.writeText(pipelineResult.renderedOutput);
  }, [pipelineResult.renderedOutput]);

  const handleValidate = useCallback(async () => {
    if (!workflowParseError) {
      setInitialWorkflowJson(workflowJsonText);
      optionsRef.current?.onSaveWorkflow?.(parsedWorkflow);

      // Associate transformer workflow with ReferenceItem and save
      if (referenceFileInfo?.referenceId) {
        try {
          const refs = await referenceApiService.loadAllReferences(REFERENCES_PROJECT_KEY);
          const targetRef = refs.find((r) => r.id === referenceFileInfo.referenceId);
          if (targetRef) {
            const updatedRef: ReferenceItem = {
              ...targetRef,
              transformer: parsedWorkflow,
            };
            await referenceApiService.update(REFERENCES_PROJECT_KEY, updatedRef);
          }
        } catch (err) {
          console.error('[useTransformer] Failed to associate transformer workflow with reference:', err);
        }
      }
    }
  }, [workflowJsonText, workflowParseError, parsedWorkflow, referenceFileInfo?.referenceId]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      const confirmSave = window.confirm(
        'You have unsaved changes in your transformation workflow. Do you want to save modifications before closing?'
      );
      if (confirmSave) {
        handleValidate();
      }
    }
    optionsRef.current?.onCloseFeature?.();
  }, [isDirty, handleValidate]);

  const updateOutputTemplate = useCallback((newTemplate: string) => {
    setWorkflowJsonText((prevJson) => {
      try {
        const parsed = JSON.parse(prevJson);
        parsed.outputTemplate = newTemplate;
        return JSON.stringify(parsed, null, 2);
      } catch {
        return prevJson;
      }
    });
  }, []);

  const updateOutputFormat = useCallback((newFormat: string) => {
    setWorkflowJsonText((prevJson) => {
      try {
        const parsed = JSON.parse(prevJson);
        parsed.outputFormat = newFormat;
        return JSON.stringify(parsed, null, 2);
      } catch {
        return prevJson;
      }
    });
  }, []);

  const insertVariableIntoTemplate = useCallback((varName: string) => {
    if (!varName) return;
    const tag = `{{${varName}}}`;
    const currentTemplate = parsedWorkflow.outputTemplate || '';

    let updatedTemplate = '';
    let nextPos = 0;

    if (
      templateCursorPos !== null &&
      templateCursorPos >= 0 &&
      templateCursorPos <= currentTemplate.length
    ) {
      const head = currentTemplate.slice(0, templateCursorPos);
      const tail = currentTemplate.slice(templateCursorPos);
      updatedTemplate = head + tag + tail;
      nextPos = templateCursorPos + tag.length;
    } else {
      updatedTemplate = currentTemplate + (currentTemplate && !currentTemplate.endsWith('\n') ? ' ' : '') + tag;
      nextPos = updatedTemplate.length;
    }

    setTemplateCursorPos(nextPos);
    updateOutputTemplate(updatedTemplate);
  }, [templateCursorPos, parsedWorkflow.outputTemplate, updateOutputTemplate]);

  return {
    scope,
    setScope,
    referenceFileInfo,
    isDirty,
    handleValidate,
    handleClose,
    inputText,
    setInputText,
    workflowJsonText,
    setWorkflowJsonText,
    workflowParseError,
    parsedWorkflow,
    pipelineResult,
    handleCopyOutput,
    updateOutputTemplate,
    updateOutputFormat,
    templateCursorPos,
    setTemplateCursorPos,
    insertVariableIntoTemplate,
  };
}
EOF

# 6. Update webview/src/components/app/project-references/hooks/useProjectReferences.ts
cat << 'EOF' > webview/src/components/app/project-references/hooks/useProjectReferences.ts
import { useState, useEffect, useMemo } from 'react';
import { referenceApiService } from '@/services/api/reference-api.service.gen';
import { urlApiService } from '@/services/api/url-api.service.gen';
import { ReferenceItem, REFERENCES_PROJECT_KEY } from '@/shared/services/reference/model/reference-model';
import {
  RefSortField,
  RefSortRule,
  ProjectReferencesViewMode,
} from '../model/prj-model-ui';

export function useProjectReferences(
  localDocumentStorage: string = REFERENCES_PROJECT_KEY,
  initialViewMode: ProjectReferencesViewMode = 'User'
) {
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [initialDefaults, setInitialDefaults] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ProjectReferencesViewMode>(initialViewMode);

  // Filter & Grouping States
  const [isGrouped, setIsGrouped] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [emojiFilter, setEmojiFilter] = useState<string>('all');
  const [selectedOnly, setSelectedOnly] = useState<boolean>(false);
  const [globalFilter, setGlobalFilter] = useState<string>('');

  // Column Visibility Toggles
  const [hideDescription, setHideDescription] = useState<boolean>(false);
  const [hideUrl, setHideUrl] = useState<boolean>(false);

  const [sortRules, setSortRules] = useState<RefSortRule[]>([
    { field: 'category', order: 'asc' },
    { field: 'name', order: 'asc' },
  ]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const fetchReferences = async () => {
    setLoading(true);
    try {
      const data = await referenceApiService.loadAllReferences(localDocumentStorage);
      setReferences(data);

      const defaultsMap: Record<string, boolean> = {};
      const catMap: Record<string, boolean> = {};
      data.forEach((r) => {
        defaultsMap[r.id] = !!r.preSelected;
        catMap[r.category] = true;
      });

      setInitialDefaults((prev) => (Object.keys(prev).length === 0 ? defaultsMap : prev));
      setExpandedCategories((prev) => ({ ...catMap, ...prev }));
    } catch (err) {
      console.error('[useProjectReferences] Failed to load references', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferences();
  }, [localDocumentStorage]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    references.forEach((r) => set.add(r.category));
    return Array.from(set);
  }, [references]);

  const emojis = useMemo(() => {
    const set = new Set<string>();
    references.forEach((r) => {
      if (r.emoji) set.add(r.emoji);
    });
    return Array.from(set);
  }, [references]);

  const handleSort = (field: RefSortField, isShiftPressed: boolean = false) => {
    setSortRules((prevRules) => {
      const existingIndex = prevRules.findIndex((r) => r.field === field);

      if (isShiftPressed) {
        if (existingIndex !== -1) {
          const currentOrder = prevRules[existingIndex].order;
          if (currentOrder === 'asc') {
            const next = [...prevRules];
            next[existingIndex] = { field, order: 'desc' };
            return next;
          } else {
            return prevRules.filter((_, idx) => idx !== existingIndex);
          }
        } else {
          return [...prevRules, { field, order: 'asc' }];
        }
      } else {
        if (existingIndex !== -1 && prevRules.length === 1) {
          return [{ field, order: prevRules[0].order === 'asc' ? 'desc' : 'asc' }];
        }
        return [{ field, order: 'asc' }];
      }
    });
  };

  const clearSort = () => {
    setSortRules([{ field: 'category', order: 'asc' }, { field: 'name', order: 'asc' }]);
  };

  const toggleCategoryExpand = (catName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  const expandAllCategories = () => {
    const allExpanded: Record<string, boolean> = {};
    categories.forEach((cat) => {
      allExpanded[cat] = true;
    });
    setExpandedCategories(allExpanded);
  };

  const collapseAllCategories = () => {
    const allCollapsed: Record<string, boolean> = {};
    categories.forEach((cat) => {
      allCollapsed[cat] = false;
    });
    setExpandedCategories(allCollapsed);
  };

  const toggleCategorySelectAll = async (catName: string) => {
    const catRefs = references.filter((r) => r.category === catName);
    if (catRefs.length === 0) return;

    const selectedCount = catRefs.filter((r) => r.preSelected).length;
    const nextSelectedState = selectedCount < catRefs.length;

    const updated = references.map((r) => {
      if (r.category === catName) {
        return { ...r, preSelected: nextSelectedState };
      }
      return r;
    });

    setReferences(updated);
    for (const r of updated.filter((x) => x.category === catName)) {
      await referenceApiService.update(localDocumentStorage, r);
    }
  };

  const toggleReferenceSelect = async (id: string) => {
    const target = references.find((r) => r.id === id);
    if (!target) return;
    const updatedRef = { ...target, preSelected: !target.preSelected };

    setReferences((prev) => prev.map((r) => (r.id === id ? updatedRef : r)));
    await referenceApiService.update(localDocumentStorage, updatedRef);
  };

  const addReference = async (newRef: Omit<ReferenceItem, 'id'>, initialContent?: string) => {
    const now = new Date().toISOString();
    const item: ReferenceItem = {
      ...newRef,
      id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      addedAt: now,
      updatedAt: now,
      changeDetected: 0,
    };
    await referenceApiService.save(localDocumentStorage, item, initialContent);
    await fetchReferences();
    return item;
  };

  const removeReference = async (id: string) => {
    await referenceApiService.delete(localDocumentStorage, id);
    setReferences((prev) => prev.filter((r) => r.id !== id));
  };

  const removeSelectedReferences = async () => {
    const selectedList = references.filter((r) => r.preSelected);
    if (selectedList.length === 0) return;

    setLoading(true);
    try {
      for (const item of selectedList) {
        await referenceApiService.delete(localDocumentStorage, item.id);
      }
      await fetchReferences();
    } catch (err) {
      console.error('[useProjectReferences] Failed to remove selected references', err);
    } finally {
      setLoading(false);
    }
  };

  const reloadReference = async (id: string) => {
    const target = references.find((r) => r.id === id);
    if (!target || !target.url) return;

    setImporting(true);
    try {
      const content = await urlApiService.readUrlContent(target.url);
      const now = new Date().toISOString();
      const updated: ReferenceItem = {
        ...target,
        sizeKb: content.length / 1024,
        updatedAt: now,
        changeDetected: 0,
      };
      await referenceApiService.save(localDocumentStorage, updated, content);
      setReferences((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      console.error('[useProjectReferences] Failed to reload reference content', err);
    } finally {
      setImporting(false);
    }
  };

  const reloadSelectedReferences = async () => {
    const selectedList = references.filter((r) => r.preSelected && r.url);
    if (selectedList.length === 0) return;

    setImporting(true);
    try {
      const now = new Date().toISOString();
      for (const item of selectedList) {
        const content = await urlApiService.readUrlContent(item.url);
        const sizeKb = content.length / 1024;
        const updated: ReferenceItem = {
          ...item,
          sizeKb,
          updatedAt: now,
          changeDetected: 0,
        };
        await referenceApiService.save(localDocumentStorage, updated, content);
      }
      await fetchReferences();
    } catch (err) {
      console.error('[useProjectReferences] Failed to reload selected references', err);
    } finally {
      setImporting(false);
    }
  };

  const importUrl = async (url: string) => {
    if (!url) return null;
    setImporting(true);
    try {
      const result = await urlApiService.readUrlContent(url);
      return result;
    } catch (err) {
      console.error('[useProjectReferences] Failed to import URL', err);
      return null;
    } finally {
      setImporting(false);
    }
  };

  const filteredReferences = useMemo(() => {
    const search = globalFilter.trim().toLowerCase();
    return references.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (emojiFilter !== 'all' && item.emoji !== emojiFilter) return false;
      if (selectedOnly && !item.preSelected) return false;

      if (search) {
        const matchName = item.name.toLowerCase().includes(search);
        const matchCategory = item.category.toLowerCase().includes(search);
        const matchDesc = item.description.toLowerCase().includes(search);
        const matchUrl = item.url.toLowerCase().includes(search);
        const matchEmoji = item.emoji.toLowerCase().includes(search);
        return matchName || matchCategory || matchDesc || matchUrl || matchEmoji;
      }
      return true;
    });
  }, [references, categoryFilter, emojiFilter, selectedOnly, globalFilter]);

  const sortedReferences = useMemo(() => {
    if (sortRules.length === 0) return filteredReferences;

    return [...filteredReferences].sort((a, b) => {
      for (const rule of sortRules) {
        let valA: string | number | boolean = '';
        let valB: string | number | boolean = '';

        switch (rule.field) {
          case 'category':
            valA = (a.category || '').toLowerCase();
            valB = (b.category || '').toLowerCase();
            break;
          case 'preSelected':
            valA = a.preSelected ? 1 : 0;
            valB = b.preSelected ? 1 : 0;
            break;
          case 'name':
            valA = (a.name || '').toLowerCase();
            valB = (b.name || '').toLowerCase();
            break;
          case 'transformer':
            valA = a.transformer ? 1 : 0;
            valB = b.transformer ? 1 : 0;
            break;
          case 'sizeKb':
            valA = a.sizeKb ?? 0;
            valB = b.sizeKb ?? 0;
            break;
          case 'sizeKbAfterTransformation':
            valA = a.sizeKbAfterTransformation ?? 0;
            valB = b.sizeKbAfterTransformation ?? 0;
            break;
          case 'updatedAt':
            valA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            valB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            break;
        }

        if (valA < valB) return rule.order === 'asc' ? -1 : 1;
        if (valA > valB) return rule.order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredReferences, sortRules]);

  const groupedReferences = useMemo(() => {
    const groups: Record<string, ReferenceItem[]> = {};
    sortedReferences.forEach((r) => {
      if (!groups[r.category]) {
        groups[r.category] = [];
      }
      groups[r.category].push(r);
    });
    return groups;
  }, [sortedReferences]);

  const categorySelectionStates = useMemo(() => {
    const states: Record<string, boolean | 'indeterminate'> = {};
    Object.entries(groupedReferences).forEach(([cat, items]) => {
      const selectedCount = items.filter((i) => i.preSelected).length;
      if (items.length > 0 && selectedCount === items.length) {
        states[cat] = true;
      } else if (selectedCount > 0) {
        states[cat] = 'indeterminate';
      } else {
        states[cat] = false;
      }
    });
    return states;
  }, [groupedReferences]);

  const globalSelectionState = useMemo<boolean | 'indeterminate'>(() => {
    if (filteredReferences.length === 0) return false;
    const selectedCount = filteredReferences.filter((r) => r.preSelected).length;
    if (selectedCount === filteredReferences.length) return true;
    if (selectedCount > 0) return 'indeterminate';
    return false;
  }, [filteredReferences]);

  const toggleAllSelect = async () => {
    if (filteredReferences.length === 0) return;
    const allSelected = filteredReferences.every((r) => r.preSelected);
    const nextState = !allSelected;
    const filteredIds = new Set(filteredReferences.map((r) => r.id));

    const updated = references.map((r) => {
      if (filteredIds.has(r.id)) {
        return { ...r, preSelected: nextState };
      }
      return r;
    });

    setReferences(updated);
    for (const r of updated.filter((x) => filteredIds.has(x.id))) {
      await referenceApiService.update(localDocumentStorage, r);
    }
  };

  const resetSelection = async () => {
    const updated = references.map((r) => ({
      ...r,
      preSelected: initialDefaults[r.id] ?? true,
    }));

    setReferences(updated);
    for (const r of updated) {
      await referenceApiService.update(localDocumentStorage, r);
    }
  };

  const totalSelectedCount = useMemo(() => references.filter((r) => r.preSelected).length, [references]);
  const totalSelectedSizeKb = useMemo(
    () => Number(references.filter((r) => r.preSelected).reduce((acc, r) => acc + (r.sizeKb || 0), 0).toFixed(2)),
    [references]
  );

  const totalAllCount = references.length;
  const totalAllSizeKb = useMemo(
    () => Number(references.reduce((acc, r) => acc + (r.sizeKb || 0), 0).toFixed(2)),
    [references]
  );

  const totalCount = filteredReferences.length;
  const totalSizeKb = useMemo(
    () => Number(filteredReferences.reduce((acc, r) => acc + (r.sizeKb || 0), 0).toFixed(2)),
    [filteredReferences]
  );

  return {
    references,
    filteredReferences,
    sortedReferences,
    groupedReferences,
    categories,
    emojis,
    categorySelectionStates,
    globalSelectionState,
    loading,
    importing,
    viewMode,
    setViewMode,
    isGrouped,
    setIsGrouped,
    categoryFilter,
    setCategoryFilter,
    emojiFilter,
    setEmojiFilter,
    selectedOnly,
    setSelectedOnly,
    globalFilter,
    setGlobalFilter,
    hideDescription,
    setHideDescription,
    hideUrl,
    setHideUrl,
    sortRules,
    handleSort,
    clearSort,
    expandedCategories,
    toggleCategoryExpand,
    expandAllCategories,
    collapseAllCategories,
    toggleCategorySelectAll,
    toggleReferenceSelect,
    toggleAllSelect,
    resetSelection,
    addReference,
    removeReference,
    removeSelectedReferences,
    reloadReference,
    reloadSelectedReferences,
    importUrl,
    totalSelectedCount,
    totalSelectedSizeKb,
    totalAllCount,
    totalAllSizeKb,
    totalCount,
    totalSizeKb,
    refetch: fetchReferences,
  };
}
EOF

# 7. Update webview/src/components/app/project-references/components/NewReferenceForm.tsx
cat << 'EOF' > webview/src/components/app/project-references/components/NewReferenceForm.tsx
import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollapsibleCard } from '@/components/app/collapsible-card';
import { ReferenceItem } from '@/shared/services/reference/model/reference-model';

interface NewReferenceFormProps {
  categories: string[];
  importing: boolean;
  onAddReference: (newRef: Omit<ReferenceItem, 'id'>, initialContent?: string) => Promise<ReferenceItem>;
  onImportUrl: (url: string) => Promise<string | null>;
}

export function NewReferenceForm({
  categories,
  importing,
  onAddReference,
  onImportUrl,
}: NewReferenceFormProps) {
  const [newCategory, setNewCategory] = useState<string>('');
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newEmoji, setNewEmoji] = useState<string>('📄');
  const [newPreSelected, setNewPreSelected] = useState<boolean>(true);
  const [newUrl, setNewUrl] = useState<string>('');
  const [importedContent, setImportedContent] = useState<string>('');
  const [importedSizeKb, setImportedSizeKb] = useState<number>(0);

  useEffect(() => {
    if (categories.length > 0 && !newCategory && !isAddingNewCategory) {
      setNewCategory(categories[0]);
    }
  }, [categories, newCategory, isAddingNewCategory]);

  const handleImportUrl = async () => {
    if (!newUrl) return;
    const result = await onImportUrl(newUrl);
    if (result) {
      setImportedContent(result);
      setImportedSizeKb(result.length / 1024);

      if (!newName) {
        const parts = newUrl.split('/');
        const filename = parts[parts.length - 1] || 'Imported Document';
        setNewName(filename.replace(/[-_]/g, ' '));
      }
      if (!newDescription) {
        setNewDescription(`Imported from ${newUrl}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isAddingNewCategory ? customCategoryInput.trim() : newCategory;
    if (!finalCategory || !newName.trim()) return;

    await onAddReference(
      {
        category: finalCategory,
        name: newName.trim(),
        description: newDescription.trim() || 'No description provided',
        emoji: newEmoji || '📄',
        preSelected: newPreSelected,
        url: newUrl.trim(),
        sizeKb: importedSizeKb || 1.2,
      },
      importedContent || undefined
    );

    setNewName('');
    setNewDescription('');
    setNewUrl('');
    setImportedContent('');
    setImportedSizeKb(0);
    setIsAddingNewCategory(false);
    setCustomCategoryInput('');
  };

  return (
    <CollapsibleCard
      title={
        <div className="flex items-center gap-1.5">
          <Plus size={13} className="text-indigo-400" />
          <span className="font-bold text-xs">New Reference</span>
        </div>
      }
      badge="Add & Import (Admin)"
      defaultExpanded={false}
      contentToCopy=""
      className="bg-card border-border"
    >
      <form onSubmit={handleSubmit} className="space-y-2 p-2 font-mono text-xs">
        <div className="gap-2 grid grid-cols-1 md:grid-cols-3">
          <div className="space-y-1">
            <label className="block font-bold text-[10px] text-muted-foreground uppercase">Category</label>
            {isAddingNewCategory ? (
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  placeholder="New category..."
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  className="h-7 font-mono text-xs"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAddingNewCategory(false)}
                  className="w-7 h-7 text-muted-foreground"
                >
                  <X size={12} />
                </Button>
              </div>
            ) : (
              <Select
                value={newCategory}
                onValueChange={(val: string | null) => {
                  if (!val) return;
                  if (val === '__new__') {
                    setIsAddingNewCategory(true);
                  } else {
                    setNewCategory(val);
                  }
                }}
              >
                <SelectTrigger className="bg-background w-60 h-7 font-mono text-xs">
                  <SelectValue placeholder="Select Category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__" className="font-bold text-indigo-400">
                    ➕ Create New Category...
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1 col-span-2">
            <label className="block font-bold text-[10px] text-muted-foreground uppercase">Name & Emoji</label>
            <div className="flex items-center gap-1.5">
              <Input
                type="text"
                placeholder="Emoji"
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                className="w-12 h-7 font-mono text-xs text-center"
              />
              <Input
                type="text"
                placeholder="Reference Name (e.g. System Architecture Spec)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 h-7 font-mono text-xs"
                required
              />
            </div>
          </div>
        </div>

        <div className="gap-2 grid grid-cols-1 md:grid-cols-3">
          <div className="space-y-1 col-span-2">
            <label className="block font-bold text-[10px] text-muted-foreground uppercase">Description</label>
            <Input
              type="text"
              placeholder="Brief summary of reference purpose..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="h-7 font-mono text-xs"
            />
          </div>

          <div className="flex flex-col justify-end space-y-1" data-tooltip="If user does a 'reset selection', pre-selected references will be selected again.">
            <label className="flex items-center gap-2 px-1 h-7 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newPreSelected}
                onChange={(e) => setNewPreSelected(e.target.checked)}
                className="border-border rounded focus:ring-indigo-500 w-3.5 h-3.5 text-indigo-500 accent-indigo-500 cursor-pointer"
              />
              <span className="font-bold text-[10px] text-foreground uppercase">Pre-selected</span>
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block font-bold text-[10px] text-muted-foreground uppercase">
            URL or Local Dependencies File
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="https://... or file:///path/to/reference.yaml"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="flex-1 h-7 font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImportUrl}
              disabled={!newUrl || importing}
              className="gap-1 h-7 font-mono text-xs shrink-0"
            >
              <RefreshCw size={12} className={importing ? 'animate-spin' : ''} />
              <span>Import</span>
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!newName || (!newCategory && !customCategoryInput)}
              className="gap-1 bg-indigo-600 hover:bg-indigo-700 h-7 font-mono text-white text-xs shrink-0"
            >
              <Plus size={12} />
              <span>Add Reference</span>
            </Button>
          </div>
        </div>
      </form>
    </CollapsibleCard>
  );
}
EOF

echo "✅ refactor: Removed inline content properties from ReferenceItem, added ReferenceFiles interface, and implemented loadReferenceFiles service on-demand loading"
