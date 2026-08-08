import React, { useEffect } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { AppLayout } from '@/components/app/layout/AppLayout';
import { HomeFeature } from '@/features/home/HomeFeature';
import { LayoutDemoFeature } from '@/features/layout-demo/LayoutDemoFeature';
import { ExplorerFeature } from '@/features/explorer/ExplorerFeature';
import { RulesFeature } from '@/features/rules/RulesFeature';
import { HelpFeature } from '@/features/help/HelpFeature';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from "@/services/api/vs-code-api.service.gen";
import { VsCodeSettings } from '@/shared/services/vscode/domain/model/VsCodeSettings.gen';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';

export let vscodeSettings: VsCodeSettings = new VsCodeSettings();

export default function App() {

  const contextStore = typeof useAppContextStore === 'function' ? useAppContextStore() : ({} as any);
  const layoutStore = typeof useLayoutStore === 'function' ? useLayoutStore() : ({} as any);

  const activeFeature = contextStore.activeFeature || 'feature-home';
  const setActiveFeature = contextStore.setActiveFeature;
  const setStatus = useAppContextStore((state) => state.setStatus);
  const isDarkMode = contextStore.isDarkMode;
  const setIsDarkMode = contextStore.setIsDarkMode;
  const notification = contextStore.notification;
  const containers = layoutStore.containers || [];

  // Trigger remote API log on mount
  useEffect(() => {
    logInfo(`SGU App component mounted. Active feature: ${activeFeature}`);
    vsCodeApiService.getExtentionSettings().then((settings: VsCodeSettings) => {
        vscodeSettings = settings;
    });
  }, []);

  useEffect(() => {
        // Register listener for 'setStatus'
        const unsubscribeStatus = vsCodeHandleMessage.on('updateStatus', (message) => {
            console.info(`Status received from extension: ${message.payload}`);
            if (message.payload) {
                setStatus(message.payload);
            }
        });

        // Cleanup event listeners on unmount
        return () => {
            unsubscribeStatus();
        };
    }, []);

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
