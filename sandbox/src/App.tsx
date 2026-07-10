import React, { useState, useEffect } from 'react';
import { ExplorerFeature } from './features/explorer/ExplorerFeature';
import { WelcomeFeature } from './features/welcome/WelcomeFeature';
import { RulesFeature } from './features/rules/RulesFeature';
import { HelpFeature } from './features/help/HelpFeature';
import { FallbackFeature } from './features/fallback/FallbackFeature';

export default function App() {
  const [activeView, setActiveView] = useState('panel-explorer');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkMode) htmlElement.classList.add('dark');
    else htmlElement.classList.remove('dark');
  }, [isDarkMode]);

  const commonProps = {
    activeView,
    setActiveView,
    isDarkMode,
    setIsDarkMode,
    isLocked,
    setIsLocked
  };

  switch (activeView) {
    case 'panel-explorer':
      return <ExplorerFeature {...commonProps} />;
    case 'panel-welcome':
      return <WelcomeFeature {...commonProps} />;
    case 'panel-rules':
      return <RulesFeature {...commonProps} />;
    case 'panel-help':
      return <HelpFeature {...commonProps} />;
    default:
      return <FallbackFeature {...commonProps} />;
  }
}
