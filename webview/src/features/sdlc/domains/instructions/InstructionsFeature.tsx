import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { SdlcSidebarMenu } from '@/features/sdlc/components/SdlcSidebarMenu';
import { LeftPanelContainer } from './containers/LeftPanelContainer';
import { RightPanelContainer } from './containers/RightPanelContainer';
import { CenterPanelContainer } from './containers/CenterPanelContainer';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function InstructionsFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-instructions');

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
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
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
        },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default InstructionsFeature;
