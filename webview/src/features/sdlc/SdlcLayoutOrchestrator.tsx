import React, { useEffect, useRef } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useSdlcWorkflowMachine } from './core/workflow/useSdlcWorkflowMachine';

import { SdlcSidebarMenu } from './ui-common/components/SdlcSidebarMenu';
import { CodebaseContextFeature } from './domains/codebase-context';
import { VibeCodingFeature, BMadMethodFeature, SpecKitFeature } from './domains/instructions';
import { LlmFeature } from './domains/llm-chat';
import { ResultsManagerFeature } from './domains/results-manager';
import { ConfigurationFeature } from './domains/configuration';

export function SdlcLayoutOrchestrator() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  const currentStep = useSdlcWorkflowMachine((s) => s.currentStep);
  const lastSetStepRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastSetStepRef.current === currentStep) return;
    lastSetStepRef.current = currentStep;

    const defaultSidebarLeft = {
      visible: true,
      container: <SdlcSidebarMenu />,
      isResizable: true,
      isHiddable: true,
    };

    const defaultSingleCenterLayout = (content: React.ReactNode) => ({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: defaultSidebarLeft,
      workspace: {
        top: { visible: false },
        left: { visible: false },
        center: {
          visible: true,
          container: content,
          isResizable: false,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' as const },
        },
        right: { visible: false },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });

    if (currentStep === 'VIBE_CODING') {
      setLayoutContainers(defaultSingleCenterLayout(<VibeCodingFeature />));
    } else if (currentStep === 'BMAD_METHOD') {
      setLayoutContainers(defaultSingleCenterLayout(<BMadMethodFeature />));
    } else if (currentStep === 'SPECKIT') {
      setLayoutContainers(defaultSingleCenterLayout(<SpecKitFeature />));
    } else if (currentStep === 'LLM_CHAT') {
      setLayoutContainers(defaultSingleCenterLayout(<LlmFeature />));
    } else if (currentStep === 'RESULTS_MANAGER') {
      setLayoutContainers(defaultSingleCenterLayout(<ResultsManagerFeature />));
    } else if (currentStep === 'CONFIGURATION') {
      setLayoutContainers(defaultSingleCenterLayout(<ConfigurationFeature />));
    }
  }, [currentStep, setLayoutContainers]);

  if (currentStep === 'CODEBASE_CONTEXT') {
    return <CodebaseContextFeature />;
  }

  return null;
}
