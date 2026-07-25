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
      {(activeFeature === 'feature-welcome') && <WelcomeFeature />}
      {activeFeature === 'layout-demo' && <LayoutDemoFeature />}
      {activeFeature === 'feature-explorer' && <ExplorerFeature />}
      {activeFeature === 'feature-rules' && <RulesFeature />}
      {activeFeature === 'feature-help' && <HelpFeature />}

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
