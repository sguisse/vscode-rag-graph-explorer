import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { SdlcSidebarMenu } from '../../ui-common/components/SdlcSidebarMenu';

import { TopPanelContainer } from './layout-ctns/TopPanelContainer';
import { LeftPanelContainer } from './layout-ctns/LeftPanelContainer';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { RightPanelContainer } from './layout-ctns/RightPanelContainer';
import { SidebarRightContainer } from './layout-ctns/SidebarRightContainer';

export function CodebaseContextFeature() {
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
        top: {
          visible: true,
          container: <TopPanelContainer />,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        left: {
          visible: true,
          container: <LeftPanelContainer />,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        center: {
          visible: true,
          container: <CenterPanelContainer />,
          isResizable: false,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: {
          visible: true,
          container: <RightPanelContainer />,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        bottom: { visible: false }
      },
      sidebarRight: {
        visible: false,
        isResizable: true,
        isHiddable: true,
        container: <SidebarRightContainer />,
      },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}
