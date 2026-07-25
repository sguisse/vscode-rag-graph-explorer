import React from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { AppLayout } from '@/components/app/layout/AppLayout';

export default function App() {
  const { activeFeature, setActiveFeature, isDarkMode, setIsDarkMode, notification } = useAppContextStore();
  const { containers } = useLayoutStore();

  return (
    <AppLayout
      activeFeature={activeFeature}
      setActiveFeature={setActiveFeature}
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
      notification={notification}
      layoutContainers={{
        workspace: {
          top: { container: containers.workspace?.top?.container },
          left: { container: containers.workspace?.left?.container },
          center: { container: containers.workspace?.center?.container },
          right: { container: containers.workspace?.right?.container },
          bottom: { container: containers.workspace?.bottom?.container },
        },
      }}
    />
  );
}
