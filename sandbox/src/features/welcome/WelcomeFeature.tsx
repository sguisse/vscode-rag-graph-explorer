import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { WelcomePanel } from './welcomePanel';

export function WelcomeFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);

  useEffect(() => {
    // Configures layout specifically for the Welcome Feature
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: { visible: false },
        left: { visible: false },
        center: { visible: true, container: <WelcomePanel />, isHiddable: false, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' } },
        right: { visible: false },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default WelcomeFeature;
