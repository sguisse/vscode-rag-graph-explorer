import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { SdlcSidebarMenu } from '../../ui-common/components/SdlcSidebarMenu';

import { TopPanelContainer } from './containers/TopPanelContainer';
import { LeftPanelContainer } from './containers/LeftPanelContainer';
import { CenterPanelContainer } from './containers/CenterPanelContainer';
import { RightPanelContainer } from './containers/RightPanelContainer';
import { SidebarRightContainer } from './containers/SidebarRightContainer';

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
        visible: true,
        isResizable: true,
        isHiddable: true,
        container: <SidebarRightContainer />,
      },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}
