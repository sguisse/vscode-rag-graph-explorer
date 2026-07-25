import React from 'react';
import { MaximizeScope } from '@/services/codebase/domain/model/types/type-maximize-scope';

export interface MaximizeContainer {
  isMaximized?: boolean;
  maximizeScope?: MaximizeScope;
}

export interface LayoutContainer {
  container?: React.ReactNode;
  visible?: boolean;
  isResizable?: boolean;
  maximizeContainer?: MaximizeContainer;
}

export interface WorkspaceContainers {
  top?: LayoutContainer;
  left?: LayoutContainer;
  center?: LayoutContainer;
  right?: LayoutContainer;
  bottom?: LayoutContainer;
}

export interface AppLayoutContainers {
  header?: LayoutContainer;
  sidebarLeft?: LayoutContainer;
  workspace?: WorkspaceContainers;
  sidebarRight?: LayoutContainer;
  footer?: LayoutContainer;
}

export interface AppLayoutProps {
  layoutContainers?: AppLayoutContainers;

  activeFeature: string;
  setActiveFeature: (feature: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;

  notification?: string | null;
}
