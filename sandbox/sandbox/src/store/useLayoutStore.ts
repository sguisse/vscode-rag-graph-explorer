import React from 'react';
import { create } from 'zustand';
import { AppLayoutContainers, LayoutContainer } from '../components/app/layout/types';

export interface LayoutStoreState {
  containers: AppLayoutContainers;

  setLayoutContainers: (containers: AppLayoutContainers) => void;
  setContainerVisible: (keyPath: string, visible: boolean) => void;
  toggleContainerVisible: (keyPath: string) => void;
  setContainerContent: (keyPath: string, content: React.ReactNode) => void;
  setContainerMaximized: (keyPath: string, isMaximized: boolean) => void;
  toggleContainerMaximized: (keyPath: string) => void;
  resetContainers: () => void;
}

export const defaultLayoutContainers: AppLayoutContainers = {
  header: { visible: true, isResizable: false },
  sidebarLeft: { visible: true, isResizable: true },
  workspace: {
    top: { visible: true, isResizable: true },
    left: { visible: true, isResizable: true, maximizeContainer: { maximizeScope: 'Workspace' } },
    center: { visible: true, isResizable: false },
    right: { visible: true, isResizable: true },
    bottom: { visible: true, isResizable: true },
  },
  sidebarRight: { visible: false, isResizable: true },
  footer: { visible: true, isResizable: false },
};

function setByPath(obj: any, path: string, updater: (c: LayoutContainer) => LayoutContainer): any {
  const parts = path.split('.');
  const cloned = { ...obj };

  let current = cloned;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    current[key] = { ...current[key] };
    current = current[key];
  }

  const lastKey = parts[parts.length - 1];
  current[lastKey] = updater(current[lastKey] || {});
  return cloned;
}

export const useLayoutStore = create<LayoutStoreState>((set) => ({
  containers: defaultLayoutContainers,

  setLayoutContainers: (containers) => set({ containers }),

  setContainerVisible: (path, visible) =>
    set((state) => ({
      containers: setByPath(state.containers, path, (c) => ({ ...c, visible })),
    })),

  toggleContainerVisible: (path) =>
    set((state) => ({
      containers: setByPath(state.containers, path, (c) => ({ ...c, visible: !c.visible })),
    })),

  setContainerContent: (path, container) =>
    set((state) => ({
      containers: setByPath(state.containers, path, (c) => ({ ...c, container })),
    })),

  setContainerMaximized: (path, isMaximized) =>
    set((state) => ({
      containers: setByPath(state.containers, path, (c) => ({
        ...c,
        maximizeContainer: {
          ...c.maximizeContainer,
          isMaximized,
        },
      })),
    })),

  toggleContainerMaximized: (path) =>
    set((state) => ({
      containers: setByPath(state.containers, path, (c) => ({
        ...c,
        maximizeContainer: {
          ...c.maximizeContainer,
          isMaximized: !c.maximizeContainer?.isMaximized,
        },
      })),
    })),

  resetContainers: () => set({ containers: defaultLayoutContainers }),
}));
