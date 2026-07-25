import React from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { AppLayout } from '@/components/app/layout/AppLayout';
import { WelcomeFeature } from '@/features/welcome/WelcomeFeature';
import { LayoutDemoFeature } from '@/features/layout-demo/LayoutDemoFeature';
import { ExplorerFeature } from '@/features/explorer/ExplorerFeature';
import { RulesFeature } from '@/features/rules/RulesFeature';
import { HelpFeature } from '@/features/help/HelpFeature';

export default function App() {
  const { activeFeature, setActiveFeature, isDarkMode, setIsDarkMode, notification } = useAppContextStore();
  const { containers } = useLayoutStore();

  return (
    <>
      {/* Feature components apply their layout configuration to LayoutStore when active */}
      {(activeFeature === 'feature-welcome') && <WelcomeFeature />}
      {(activeFeature === 'feature-explorer') && <ExplorerFeature />}
      {activeFeature === 'layout-demo' && <LayoutDemoFeature />}
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
