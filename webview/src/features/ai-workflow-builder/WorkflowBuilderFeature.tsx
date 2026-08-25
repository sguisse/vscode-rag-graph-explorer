import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { WorkflowBuilderPanel } from './WorkflowBuilderPanel';
import { NodePalettePanel } from './components/palette/NodePalettePanel';
import { AttributesPanel } from './components/inspector/AttributesPanel';

export function WorkflowBuilderFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: { visible: false },
        left: {
          visible: true,
          container: <NodePalettePanel />,
          isHiddable: true,
        },
        center: {
          visible: true,
          container: <WorkflowBuilderPanel />,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: {
          visible: true,
          container: <AttributesPanel />,
          isHiddable: true,
        },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default WorkflowBuilderFeature;
