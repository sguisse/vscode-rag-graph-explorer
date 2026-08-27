import { useState } from 'react';
import { AppLayoutConfig, AppLayoutContainers } from '../types';

export function useLayoutState(initialConfig?: AppLayoutConfig) {
  const [config, setConfig] = useState<AppLayoutConfig | undefined>(initialConfig);

  return {
    config,
    setConfig,
  };
}
