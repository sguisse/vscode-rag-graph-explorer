import React from 'react';
import { create } from 'zustand';
import { AppLayoutContainers, LayoutContainer } from '../components/app/layout/types';
import { defaultLayoutContainersContent } from '../features/layout-demo/default-layout-containers-content';

export interface LayoutStoreState {
  containers: AppLayoutContainers;

  setLayoutContainers: (containers: AppLayoutContainers, preserveVisibility?: boolean) => void;
  setContainerVisible: (keyPath: string, visible: boolean) => void;
  toggleContainerVisible: (keyPath: string) => void;
  setContainerContent: (keyPath: string, content: React.ReactNode) => void;
  setContainerMaximized: (keyPath: string, isMaximized: boolean) => void;
  toggleContainerMaximized: (keyPath: string) => void;
  resetContainers: () => void;
}

export const defaultLayoutContainers: AppLayoutContainers = {
  header: { visible: true, isResizable: false, isHiddable: false, maximizeContainer: { isMaximizable: false, isMaximized: false, maximizeScope: 'Main' } },
  sidebarLeft: { visible: true, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: false, isMaximized: false, maximizeScope: 'Main' } },
  workspace: {
    top: { visible: true, isResizable: true, isHiddable: true, container: defaultLayoutContainersContent.top, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' } },
    left: { visible: true, isResizable: true, isHiddable: true, container: defaultLayoutContainersContent.left, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' } },
    center: { visible: true, isResizable: false, isHiddable: false, container: defaultLayoutContainersContent.center, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' } },
    right: { visible: true, isResizable: true, isHiddable: true, container: defaultLayoutContainersContent.right, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' } },
    bottom: { visible: true, isResizable: true, isHiddable: true, container: defaultLayoutContainersContent.bottom, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' } },
  },
  sidebarRight: { visible: false, isResizable: true, isHiddable: true, container: defaultLayoutContainersContent.sidebarRight, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' } },
  footer: { visible: true, isResizable: false, isHiddable: false, maximizeContainer: { isMaximizable: false, isMaximized: false, maximizeScope: 'Main' } },
};

function preserveRuntimeState(nextC?: LayoutContainer, prevC?: LayoutContainer): LayoutContainer | undefined {
  if (!nextC) return prevC;
  if (!prevC) return nextC;
  return {
    ...nextC,
    visible: prevC.visible !== undefined ? prevC.visible : nextC.visible,
    maximizeContainer: nextC.maximizeContainer ? {
      ...nextC.maximizeContainer,
      isMaximized: prevC.maximizeContainer?.isMaximized !== undefined
        ? prevC.maximizeContainer.isMaximized
        : nextC.maximizeContainer?.isMaximized
    } : prevC.maximizeContainer
  };
}

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

  setLayoutContainers: (newContainers, preserveVisibility = true) =>
    set((state) => {
      if (!preserveVisibility) {
        return { containers: newContainers };
      }
      return {
        containers: {
          header: preserveRuntimeState(newContainers.header, state.containers.header),
          sidebarLeft: preserveRuntimeState(newContainers.sidebarLeft, state.containers.sidebarLeft),
          workspace: {
            top: preserveRuntimeState(newContainers.workspace?.top, state.containers.workspace?.top),
            left: preserveRuntimeState(newContainers.workspace?.left, state.containers.workspace?.left),
            center: preserveRuntimeState(newContainers.workspace?.center, state.containers.workspace?.center),
            right: preserveRuntimeState(newContainers.workspace?.right, state.containers.workspace?.right),
            bottom: preserveRuntimeState(newContainers.workspace?.bottom, state.containers.workspace?.bottom),
          },
          sidebarRight: preserveRuntimeState(newContainers.sidebarRight, state.containers.sidebarRight),
          footer: preserveRuntimeState(newContainers.footer, state.containers.footer),
        }
      };
    }),

  setContainerVisible: (path, visible) =>
    set((state) => ({
      containers: setByPath(state.containers, path, (c) => ({
        ...c,
        visible,
        maximizeContainer: {
          ...c.maximizeContainer,
          isMaximized: visible ? c.maximizeContainer?.isMaximized : false,
        },
      })),
    })),

  toggleContainerVisible: (path) =>
    set((state) => ({
      containers: setByPath(state.containers, path, (c) => {
        const nextVisible = !c.visible;
        return {
          ...c,
          visible: nextVisible,
          maximizeContainer: {
            ...c.maximizeContainer,
            isMaximized: nextVisible ? c.maximizeContainer?.isMaximized : false,
          },
        };
      }),
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
      containers: setByPath(state.containers, path, (c) => {
        if (c.maximizeContainer?.isMaximizable === false) {
          return c;
        }
        return {
          ...c,
          maximizeContainer: {
            ...c.maximizeContainer,
            isMaximized: !c.maximizeContainer?.isMaximized,
          },
        };
      }),
    })),

  resetContainers: () => set({ containers: defaultLayoutContainers }),
}));
