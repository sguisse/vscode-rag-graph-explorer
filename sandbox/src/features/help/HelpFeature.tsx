import React from 'react';
import { AppLayout } from '@/components/app/layout/AppLayout';
import { useAppContextStore } from '@/store/useAppContextStore';

export function HelpFeature() {
  const { activeFeature, setActiveFeature, isDarkMode, setIsDarkMode, notification } = useAppContextStore();

  return (
    <AppLayout
      activeFeature={activeFeature}
      setActiveFeature={setActiveFeature}
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
      notification={notification}
    />
  );
}
