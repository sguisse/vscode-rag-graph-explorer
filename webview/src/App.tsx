import React, { useEffect } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { AppLayout } from '@/_layout/AppLayout';
import { HomeFeature } from '@/features/home/HomeFeature';
import { InstallFeature } from '@/features/install/InstallFeature';
import { LayoutDemoFeature } from '@/features/layout-demo/LayoutDemoFeature';
import { WorkflowBuilderFeature } from '@/features/ai-workflow-builder/WorkflowBuilderFeature';
import { ExporterFeature } from '@/features/exporter/ExporterFeature';
import { RulesFeature } from '@/features/rules/RulesFeature';
import { HelpFeature } from '@/features/help/HelpFeature';
import { SdlcLayoutOrchestrator } from '@/features/sdlc/SdlcLayoutOrchestrator';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from "@/services/api/vs-code-api.service.gen";
import { VsCodeSettings } from '@/shared/services/vscode/domain/model/VsCodeSettings.gen';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { initSessionPersistence } from '@/features/sdlc/core/vscode-sync/session-persistence.manager';
import ExplorerFeature from './features/explorer-old/ExplorerFeature';

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
    vsCodeApiService.getExtensionSettings().then((settings: VsCodeSettings) => {
        vscodeSettings = settings;
    });

    // Initialize SDLC session persistence sync
    initSessionPersistence();
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
      {(activeFeature === 'feature-install') && InstallFeature && <InstallFeature />}
      {(activeFeature === 'feature-ai-workflow-builder') && WorkflowBuilderFeature && <WorkflowBuilderFeature />}
      {(activeFeature === 'feature-codebase-exporter' || activeFeature === 'feature-exporter') && ExporterFeature && <ExporterFeature />}
      {(activeFeature === 'feature-layout-demo') && LayoutDemoFeature && <LayoutDemoFeature />}
      {(activeFeature === 'feature-rules') && RulesFeature && <RulesFeature />}
      {(activeFeature === 'feature-help') && HelpFeature && <HelpFeature />}

      {/* Replaced monolithic ExplorerFeature with the new SDLC Orchestrator */}
      {(activeFeature === 'feature-graph-rag-explorer') && <ExplorerFeature />}
      {(activeFeature === 'feature-sdlc') && <SdlcLayoutOrchestrator />}

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
