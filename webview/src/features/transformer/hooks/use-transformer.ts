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
