import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { defaultLayoutContainersContent } from '@/features/layout-demo/default-layout-containers-content';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function LayoutDemoFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-layout-demo');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: { visible: true, container: defaultLayoutContainersContent.top, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: true, maximizeScope: 'Main' } },
        left: { visible: true, container: defaultLayoutContainersContent.left, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: true, maximizeScope: 'Workspace' } },
        center: { visible: true, container: defaultLayoutContainersContent.center, isResizable: false, isHiddable: false, maximizeContainer: { isMaximizable: true, maximizeScope: 'Main' } },
        right: { visible: true, container: defaultLayoutContainersContent.right, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: true, maximizeScope: 'Main' } },
        bottom: { visible: true, container: defaultLayoutContainersContent.bottom, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: true, maximizeScope: 'Main' } },
      },
      sidebarRight: { visible: true, container: defaultLayoutContainersContent.sidebarRight, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: true, maximizeScope: 'Main' } },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default LayoutDemoFeature;
