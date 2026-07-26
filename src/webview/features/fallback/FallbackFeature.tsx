import React from 'react';
import { AppLayout } from '@/components/app/layout/AppLayout';
import { useAppContextStore } from '@/store/useAppContextStore';

export function FallbackFeature() {
  const { activeFeature, setActiveFeature, isDarkMode, setIsDarkMode, notification } = useAppContextStore();

  return (
    <AppLayout
      activeFeature={activeFeature}
      setActiveFeature={setActiveFeature}
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
      notification={notification}
      layoutContainers={{
        workspace: {
          center: {
            container: (
              <div className="p-6 font-mono text-xs">
                <h3 className="font-bold text-sm text-foreground">Fallback Feature Deactivated</h3>
                <p className="text-muted-foreground mt-1">Feature deactivated for layout refactoring.</p>
              </div>
            )
          }
        }
      }}
    />
  );
}
