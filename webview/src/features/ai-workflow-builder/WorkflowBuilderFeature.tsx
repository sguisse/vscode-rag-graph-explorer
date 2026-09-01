import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { LeftPanelContainer } from './layout-ctns/LeftPanelContainer';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { RightPanelContainer } from './layout-ctns/RightPanelContainer';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function WorkflowBuilderFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-ai-workflow-builder');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: { visible: false },
        left: {
          visible: true,
          container: <LeftPanelContainer />,
          isHiddable: true,
        },
        center: {
          visible: true,
          container: <CenterPanelContainer />,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: {
          visible: true,
          container: <RightPanelContainer />,
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
