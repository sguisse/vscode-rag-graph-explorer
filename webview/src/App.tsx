import React from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { AppLayout } from '@/components/app/layout/AppLayout';
import { HomeFeature } from '@/features/home/HomeFeature';
import { LayoutDemoFeature } from '@/features/layout-demo/LayoutDemoFeature';
import { ExplorerFeature } from '@/features/explorer/ExplorerFeature';
import { RulesFeature } from '@/features/rules/RulesFeature';
import { HelpFeature } from '@/features/help/HelpFeature';

export default function App() {
  const contextStore = typeof useAppContextStore === 'function' ? useAppContextStore() : ({} as any);
  const layoutStore = typeof useLayoutStore === 'function' ? useLayoutStore() : ({} as any);

  const activeFeature = contextStore.activeFeature || 'feature-home';
  const setActiveFeature = contextStore.setActiveFeature;
  const isDarkMode = contextStore.isDarkMode;
  const setIsDarkMode = contextStore.setIsDarkMode;
  const notification = contextStore.notification;
  const containers = layoutStore.containers || [];

  return (
    <>
      {(activeFeature === 'feature-home') && HomeFeature && <HomeFeature />}
      {(activeFeature === 'feature-graph-rag-explorer') && ExplorerFeature && <ExplorerFeature />}
      {(activeFeature === 'feature-layout-demo') && LayoutDemoFeature && <LayoutDemoFeature />}
      {(activeFeature === 'feature-rules') && RulesFeature && <RulesFeature />}
      {(activeFeature === 'feature-help') && HelpFeature && <HelpFeature />}

      {AppLayout && (
        <AppLayout
          activeFeature={activeFeature}
          setActiveFeature={setActiveFeature}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          notification={notification}
          layoutContainers={containers}
        />
      )}
    </>
  );
}
