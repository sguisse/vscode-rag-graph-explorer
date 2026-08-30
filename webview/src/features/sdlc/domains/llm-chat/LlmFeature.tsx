import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { SdlcSidebarMenu } from '@/features/sdlc/components/SdlcSidebarMenu';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { RightPanelContainer } from './layout-ctns/RightPanelContainer';

export function LlmFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);

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
        left: { visible: false },
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

export default LlmFeature;
