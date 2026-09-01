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

  const onValidateHandler = () => {
    handleValidate();
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
          visible: false,
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
