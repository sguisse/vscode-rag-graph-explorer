import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useTransformer } from './hooks/use-transformer';
import { TopPanelContainer } from './layout-ctns/TopPanelContainer';
import { LeftPanelContainer } from './layout-ctns/LeftPanelContainer';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { RightPanelContainer } from './layout-ctns/RightPanelContainer';
import { BottomPanelContainer } from './layout-ctns/BottomPanelContainer';

export function TransformerFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);

  const {
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
  } = useTransformer();

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: {
          visible: true,
          container: <TopPanelContainer />,
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
              records={pipelineResult.records}
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
              onCopy={handleCopyOutput}
              onUpdateOutputTemplate={updateOutputTemplate}
              onUpdateOutputFormat={updateOutputFormat}
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
  ]);

  return null;
}

export default TransformerFeature;
