import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';

export function ExplorerFeature() {
  const resetContainers = useLayoutStore((s) => s.resetContainers);

  useEffect(() => {
    resetContainers();
  }, [resetContainers]);

  return null;
}
