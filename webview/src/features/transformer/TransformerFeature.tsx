import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useTransformer } from './hooks/use-transformer';
import { TransformationScopeType, ReferenceFileInfo } from './components/TransformationScopePanel';
import { TopPanelContainer } from './layout-ctns/TopPanelContainer';
import { LeftPanelContainer } from './layout-ctns/LeftPanelContainer';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { RightPanelContainer } from './layout-ctns/RightPanelContainer';
import { BottomPanelContainer } from './layout-ctns/BottomPanelContainer';
import { TransformerWorkflow } from '@/shared/services/transform-content/model/transform-content-model';

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

  const {
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
  } = useTransformer({
    initialScope,
    initialReferenceFileInfo,
    initialWorkflow,
    onSaveWorkflow,
    onCloseFeature,
  });

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
              onValidate={handleValidate}
              onClose={handleClose}
            />
          ),
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
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
  ]);

  return null;
}

export default TransformerFeature;
