import React, { useEffect } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '@/router';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from "@/services/api/vs-code-api.service.gen";
import { VsCodeSettings } from '@/shared/services/vscode/model/VsCodeSettings.gen';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { initSessionPersistence } from '@/features/sdlc/core/vscode-sync/session-persistence.manager';
import { useAppContextStore } from '@/store/useAppContextStore';

export let vscodeSettings: VsCodeSettings = new VsCodeSettings();

export default function App() {
  const setStatus = useAppContextStore((state) => state.setStatus);

  useEffect(() => {
    logInfo(`TanStack Router App component mounted.`);
    vsCodeApiService.getExtensionSettings().then((settings: VsCodeSettings) => {
      vscodeSettings = settings;
    });

    initSessionPersistence();
  }, []);

  useEffect(() => {
    const unsubscribeStatus = vsCodeHandleMessage.on('updateStatus', (message) => {
      console.info(`Status received from extension: ${message.payload}`);
      if (message.payload) {
        setStatus(message.payload);
      }
    });

    return () => {
      unsubscribeStatus();
    };
  }, [setStatus]);

  return <RouterProvider router={router} />;
}
