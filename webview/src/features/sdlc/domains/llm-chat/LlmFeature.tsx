import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { SdlcSidebarMenu } from '@/features/sdlc/components/SdlcSidebarMenu';
import { LeftPanelContainer } from './layout-ctns/LeftPanelContainer';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { RightPanelContainer } from './layout-ctns/RightPanelContainer';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function LlmFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-llm-chat');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: {
        visible: true,
        container: <SdlcSidebarMenu />,
        isResizable: true,
        isHiddable: true,
      },
      workspace: {
        top: { visible: false },
        left: {
          visible: true,
          container: <LeftPanelContainer />,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' as const },
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
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' as const },
          workspaceRightWidth: 900,
        },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default LlmFeature;
