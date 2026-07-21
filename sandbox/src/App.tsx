import React, { useState, useEffect } from 'react';
import { ExplorerFeature } from './features/explorer/ExplorerFeature';
import { WelcomeFeature } from './features/welcome/WelcomeFeature';
import { RulesFeature } from './features/rules/RulesFeature';
import { HelpFeature } from './features/help/HelpFeature';
import { FallbackFeature } from './features/fallback/FallbackFeature';

// OCP Strategy View Registry Map for scalable screen navigation routing
const VIEW_REGISTRY: Record<string, React.ComponentType<any>> = {
  'panel-explorer': ExplorerFeature,
  'panel-welcome': WelcomeFeature,
  'panel-rules': RulesFeature,
  'panel-help': HelpFeature,
};

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

  const ActiveComponent = VIEW_REGISTRY[activeView] || FallbackFeature;

  return <ActiveComponent {...commonProps} />;
}
