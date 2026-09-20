import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';

export function BookmarksFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-bookmarks');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: false, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: { visible: false },
        left: { visible: false },
        center: {
          visible: true,
          container: <CenterPanelContainer/>,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: { visible: false },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default BookmarksFeature;
