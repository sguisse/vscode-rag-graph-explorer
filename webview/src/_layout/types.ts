import React from 'react';
import { MaximizeScope } from '@/shared/services/graph-rag-explorer/domain/model/types';

export interface MaximizeContainer {
  isMaximizable?: boolean;
  isMaximized?: boolean;
  maximizeScope?: MaximizeScope;
}

export interface LayoutContainer {
  container?: React.ReactNode;
  visible?: boolean;
  isResizable?: boolean;
  isHiddable?: boolean;

  // Named dimension overrides replacing global defaults
  headerHeight?: number;
  sidebarLeftWidth?: number;
  workspaceTopHeight?: number;
  workspaceLeftWidth?: number;
  workspaceRightWidth?: number;
  workspaceBottomHeight?: number;
  sidebarRightWidth?: number;
  footerHeight?: number;

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

// Export alias for AppLayoutConfig
export type AppLayoutConfig = AppLayoutContainers;

export interface AppLayoutProps {
  activeFeature?: string;
  setActiveFeature?: (feature: string) => void;
  isDarkMode?: boolean;
  setIsDarkMode?: (isDarkMode: boolean) => void;
  notification?: string | null;
  layoutContainers?: AppLayoutContainers;
}
