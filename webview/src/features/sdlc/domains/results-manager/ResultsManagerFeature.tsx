import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { CenterPanelContainer } from './layout-ctns/CenterPanelContainer';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';

export function ResultsManagerFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-results-manager');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
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
          visible: false,
        },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default ResultsManagerFeature;
