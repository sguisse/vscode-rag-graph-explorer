import React, { useEffect } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { AppLayout } from '@/components/app/layout/AppLayout';
import { HomeFeature } from '@/features/home/HomeFeature';
import { LayoutDemoFeature } from '@/features/layout-demo/LayoutDemoFeature';
import { ExplorerFeature } from '@/features/explorer/ExplorerFeature';
import { RulesFeature } from '@/features/rules/RulesFeature';
import { HelpFeature } from '@/features/help/HelpFeature';
import { codebaseService } from '@/services/codebase';

declare const acquireVsCodeApi: () => any;

let vscodeApi: any = null;
try {
  if (typeof acquireVsCodeApi === 'function') {
    vscodeApi = acquireVsCodeApi();
    (window as any).vscodeApi = vscodeApi;
  }
} catch (e) {
  vscodeApi = (window as any).vscodeApi || null;
}

export default function App() {
  const { activeFeature, setActiveFeature, isDarkMode, setIsDarkMode, notification, setNotification } = useAppContextStore();
  const { containers } = useLayoutStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (vscodeApi) {
      vscodeApi.postMessage({ command: 'ready' });
    }

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (!message || !message.command) return;

      switch (message.command) {
        case 'updateGraphData':
          if (message.payload) {
            codebaseService.importCodebase(message.payload);
            setNotification('Graph data updated from VS Code scan');
          }
          break;
        case 'updateStatus':
          if (message.payload === 'building') {
            setNotification('Analyzing codebase graph...');
          } else if (message.payload === 'ready') {
            setNotification('Graph analysis ready');
          }
          break;
        case 'setConfig':
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setNotification]);

  return (
    <>
      {/* Active Feature updates LayoutStore containers dynamically when menu items are clicked */}
      {(activeFeature === 'feature-home' || activeFeature === 'feat-welcome') && <HomeFeature />}
      {(activeFeature === 'feature-graph-explorer') && <ExplorerFeature />}
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
