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
      {/* Active Feature updates LayoutStore containers dynamically when menu items are clicked */}
      {(activeFeature === 'panel-welcome' || activeFeature === 'feature-welcome' || activeFeature === 'welcome') && <WelcomeFeature />}
      {(activeFeature === 'panel-explorer' || activeFeature === 'feature-explorer' || activeFeature === 'explorer') && <ExplorerFeature />}
      {(activeFeature === 'layout-demo' || activeFeature === 'feature-layout') && <LayoutDemoFeature />}
      {(activeFeature === 'panel-rules' || activeFeature === 'feature-rules' || activeFeature === 'rules') && <RulesFeature />}
      {(activeFeature === 'panel-help' || activeFeature === 'feature-help' || activeFeature === 'help') && <HelpFeature />}

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
