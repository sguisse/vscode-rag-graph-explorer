#!/usr/bin/env bash
set -e

# Ensure target directories exist
mkdir -p backend/src/services/reference
mkdir -p webview/src/features/transformer
mkdir -p webview/src/features/transformer/hooks
mkdir -p webview/src/features/transformer/components/output-panel/tabs

# 1. Update backend/src/services/reference/reference-service.adapter.ts
# Ensures original & transformed directories exist, loads original file content, applies transformation via transformerService,
# and writes the result to REFERENCES_TRANSFORMED_PATH (`${reference.id}.txt`).
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
        this.ensureDirectoriesExist();
    }

    private ensureDirectoriesExist(): void {
        [REFERENCES_ORIGINAL_PATH, REFERENCES_TRANSFORMED_PATH, REFERENCES_TEMP_PATH].forEach((dir) => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
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
        this.ensureDirectoriesExist();
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
        this.ensureDirectoriesExist();
        const store = this.readYamlStore();
        const list = store[storageKey] || [];
        const existingIndex = list.findIndex((r) => r.id === reference.id);

        const originalStoragePath = path.join(REFERENCES_ORIGINAL_PATH, `${reference.id}.txt`);

        if (initialContent !== undefined) {
            await this.getFileSystemService().writeFile(originalStoragePath, initialContent);
            reference.sizeKb = Number((Buffer.byteLength(initialContent, 'utf8') / 1024).toFixed(2));
        } else if (!(await this.getFileSystemService().exists(originalStoragePath)) && reference.url) {
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

        let originalContent = '';
        if (await this.getFileSystemService().exists(originalStoragePath)) {
            originalContent = (await this.getFileSystemService().readFile(originalStoragePath)) || '';
            reference.sizeKb = Number((Buffer.byteLength(originalContent, 'utf8') / 1024).toFixed(2));
        }

        // Apply transformer workflow on original source and save output to REFERENCES_TRANSFORMED_PATH
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

        // Remove legacy embedded content attributes
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

# 2. Update webview/src/features/transformer/hooks/use-transformer.ts
# Assures handleValidate awaits the update call to trigger backend transformation
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

      // Associate transformer workflow with ReferenceItem and save (triggers backend transformation)
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

  const handleClose = useCallback(async () => {
    if (isDirty) {
      const confirmSave = window.confirm(
        'You have unsaved changes in your transformation workflow. Do you want to save modifications before closing?'
      );
      if (confirmSave) {
        await handleValidate();
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

# 3. Update webview/src/features/transformer/TransformerFeature.tsx
# Ensure onValidateHandler awaits handleValidate before navigating
cat << 'EOF' > webview/src/features/transformer/TransformerFeature.tsx
import React, { useEffect, useMemo } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useTransformer } from './hooks/use-transformer';
import { TransformationScopeType, ReferenceFileInfo } from './components/TransformationScopePanel';
import { TopPanelContainer } from './layout-ctns/TopPanelContainer';
import { LeftPanelContainer } from './layout-ctns/LeftPanelContainer';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { RightPanelContainer } from './layout-ctns/RightPanelContainer';
import { BottomPanelContainer } from './layout-ctns/BottomPanelContainer';
import { TransformerWorkflow } from '@/shared/services/transform-content/model/transform-content-model';
import { TransformerSearch } from '@/router';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export interface TransformerFeatureProps {
  initialScope?: TransformationScopeType;
  initialReferenceFileInfo?: ReferenceFileInfo;
  initialWorkflow?: TransformerWorkflow;
  onSaveWorkflow?: (workflow: TransformerWorkflow) => void;
  onCloseFeature?: () => void;
}

export function TransformerFeature({
  initialScope,
  initialReferenceFileInfo,
  initialWorkflow,
  onSaveWorkflow,
  onCloseFeature,
}: TransformerFeatureProps = {}) {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  const navigate = useNavigate();

  useBreadcrumbNavigation('feature-transformer');

  const searchParams = useSearch({ strict: false }) as TransformerSearch & { fromFeature?: string };

  const effectiveScope = (searchParams?.scope as TransformationScopeType) || initialScope || 'Default';

  const effectiveRefInfo = useMemo<ReferenceFileInfo | undefined>(() => {
    if (searchParams?.fileName) {
      return {
        fileName: searchParams.fileName,
        filePath: searchParams.filePath,
        language: searchParams.language,
        referenceId: searchParams.referenceId,
      };
    }
    return initialReferenceFileInfo;
  }, [searchParams?.fileName, searchParams?.filePath, searchParams?.language, searchParams?.referenceId, initialReferenceFileInfo]);

  const hasPreviousFeature = Boolean(
    searchParams?.fromFeature ||
    searchParams?.fileName ||
    (typeof window !== 'undefined' && window.history.length > 1)
  );

  const handleReturnToPrevious = (actionType: 'Validated & Saved' | 'Closed') => {
    if (hasPreviousFeature) {
      logInfo('go back to prev screen');
    }

    if (onCloseFeature) {
      onCloseFeature();
    } else {
      navigate({
        to: '/references',
        search: {
          updatedAt: Date.now(),
          updatedFile: effectiveRefInfo?.fileName || 'Reference Document',
          sourceAction: actionType,
        },
      });
    }
  };

  const {
    scope,
    setScope,
    referenceFileInfo,
    isDirty,
    handleValidate,
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
  } = useTransformer({
    initialScope: effectiveScope,
    initialReferenceFileInfo: effectiveRefInfo,
    initialWorkflow,
    onSaveWorkflow: (wf) => {
      onSaveWorkflow?.(wf);
      handleReturnToPrevious('Validated & Saved');
    },
    onCloseFeature: () => handleReturnToPrevious('Closed'),
  });

  const onValidateHandler = async () => {
    await handleValidate();
    if (hasPreviousFeature) {
      logInfo('go back to prev screen');
      handleReturnToPrevious('Validated & Saved');
    }
  };

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: {
          visible: true,
          container: (
            <TopPanelContainer
              scope={scope}
              onScopeChange={setScope}
              referenceFileInfo={referenceFileInfo}
              isDirty={isDirty}
              hasPreviousFeature={hasPreviousFeature}
              onValidate={onValidateHandler}
              onClose={() => handleReturnToPrevious('Closed')}
            />
          ),
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
          workspaceTopHeight: 70,
        },
        left: {
          visible: true,
          container: (
            <LeftPanelContainer
              inputText={inputText}
              setInputText={setInputText}
            />
          ),
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        center: {
          visible: true,
          container: (
            <CenterPanelContainer
              workflowJsonText={workflowJsonText}
              setWorkflowJsonText={setWorkflowJsonText}
              workflowParseError={workflowParseError}
              parsedWorkflow={parsedWorkflow}
              onSelectVariable={insertVariableIntoTemplate}
            />
          ),
          isResizable: false,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: {
          visible: true,
          container: (
            <RightPanelContainer
              renderedOutput={pipelineResult.renderedOutput}
              outputFormat={parsedWorkflow.outputFormat}
              outputTemplate={parsedWorkflow.outputTemplate}
              records={pipelineResult.records}
              onCopy={handleCopyOutput}
              onUpdateOutputTemplate={updateOutputTemplate}
              onUpdateOutputFormat={updateOutputFormat}
              templateCursorPos={templateCursorPos}
              setTemplateCursorPos={setTemplateCursorPos}
              onSelectVariable={insertVariableIntoTemplate}
            />
          ),
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        bottom: {
          visible: true,
          container: <BottomPanelContainer metrics={pipelineResult.metrics} />,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
      },
      sidebarRight: { visible: false, isResizable: true, isHiddable: true },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [
    setLayoutContainers,
    scope,
    setScope,
    referenceFileInfo,
    isDirty,
    hasPreviousFeature,
    handleValidate,
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
  ]);

  return null;
}

export default TransformerFeature;
EOF

echo "✅ feat: Validation now awaits backend reference update, applies transformer on original source content, and saves result in REFERENCES_TRANSFORMED_PATH!"
