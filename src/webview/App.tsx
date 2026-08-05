import React, { useEffect } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { AppLayout } from '@/components/app/layout/AppLayout';
import { HomeFeature } from '@/features/home/HomeFeature';
import { LayoutDemoFeature } from '@/features/layout-demo/LayoutDemoFeature';
import { ExplorerFeature } from '@/features/explorer/ExplorerFeature';
import { RulesFeature } from '@/features/rules/RulesFeature';
import { HelpFeature } from '@/features/help/HelpFeature';
import { logInfo } from '@/lib/utils-frontend-log';
import { initializeDefaultServices } from './services/WebviewInitializerService';

// Safely initialize the VS Code API
if (!window.vscodeApi) {
  if (typeof acquireVsCodeApi === 'function') {
    window.vscodeApi = acquireVsCodeApi();
  } else {
    // Fallback mock for Vite browser development
    window.vscodeApi = {
      postMessage: (msg: unknown) => console.log('[Mock VSCode PostMessage]:', msg),
      getState: () => ({}),
      setState: (state: unknown) => console.log('[Mock VSCode SetState]:', state),
    };
  }
}

initializeDefaultServices();

logInfo('[Webview] VS Code API initialized.');

export default function App() {
  const { activeFeature, setActiveFeature, isDarkMode, setIsDarkMode, notification } = useAppContextStore();
  const { containers } = useLayoutStore();

  return (
    <>
      {(activeFeature === 'feature-home') && <HomeFeature />}
      {(activeFeature === 'feature-graph-rag-explorer') && <ExplorerFeature />}
      {(activeFeature === 'feature-layout-demo') && <LayoutDemoFeature />}
      {(activeFeature === 'feature-rules') && <RulesFeature />}
      {(activeFeature === 'feature-help') && <HelpFeature />}

      <AppLayout
        activeFeature={activeFeature}
        setActiveFeature={setActiveFeature}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        notification={notification}
        layoutContainers={containers}
      />
    </>
  );
}
