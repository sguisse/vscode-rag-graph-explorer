import { useState } from 'react';
import { AppLayoutConfig } from '../AppLayout';

export interface LayoutVisibilityState {
  isCtnWorkspaceVisible: boolean;
  isCtnWorkspaceTopVisible: boolean;
  isCtnWorkspaceLeftVisible: boolean;
  isCtnWorkspaceCenterVisible: boolean;
  isCtnWorkspaceRightVisible: boolean;
  isCtnWorkspaceBottomVisible: boolean;
  isSidebarRightVisible: boolean;
}

export interface LayoutVisibilityActions {
  setIsCtnWorkspaceVisible: (visible: boolean) => void;
  setIsCtnWorkspaceTopVisible: (visible: boolean) => void;
  setIsCtnWorkspaceLeftVisible: (visible: boolean) => void;
  setIsCtnWorkspaceCenterVisible: (visible: boolean) => void;
  setIsCtnWorkspaceRightVisible: (visible: boolean) => void;
  setIsCtnWorkspaceBottomVisible: (visible: boolean) => void;
  setIsSidebarRightVisible: (visible: boolean) => void;
}

export function useLayoutState(layoutConfig: AppLayoutConfig = {}) {
  const [isCtnWorkspaceVisible, setIsCtnWorkspaceVisible] = useState(true);
  const [isCtnWorkspaceTopVisible, setIsCtnWorkspaceTopVisible] = useState(layoutConfig.showCtnWkpTop ?? false);
  const [isCtnWorkspaceLeftVisible, setIsCtnWorkspaceLeftVisible] = useState(layoutConfig.showCtnWkpLeft ?? false);
  const [isCtnWorkspaceCenterVisible, setIsCtnWorkspaceCenterVisible] = useState(layoutConfig.showCtnWkpCenter ?? false);
  const [isCtnWorkspaceRightVisible, setIsCtnWorkspaceRightVisible] = useState(layoutConfig.showCtnWkpRight ?? false);
  const [isCtnWorkspaceBottomVisible, setIsCtnWorkspaceBottomVisible] = useState(layoutConfig.showCtnWkpBottom ?? false);
  const [isSidebarRightVisible, setIsSidebarRightVisible] = useState(layoutConfig.showRightSidebar ?? false);

  const visibility: LayoutVisibilityState = {
    isCtnWorkspaceVisible,
    isCtnWorkspaceTopVisible,
    isCtnWorkspaceLeftVisible,
    isCtnWorkspaceCenterVisible,
    isCtnWorkspaceRightVisible,
    isCtnWorkspaceBottomVisible,
    isSidebarRightVisible
  };

  const actions: LayoutVisibilityActions = {
    setIsCtnWorkspaceVisible,
    setIsCtnWorkspaceTopVisible,
    setIsCtnWorkspaceLeftVisible,
    setIsCtnWorkspaceCenterVisible,
    setIsCtnWorkspaceRightVisible,
    setIsCtnWorkspaceBottomVisible,
    setIsSidebarRightVisible
  };

  return { visibility, actions };
}
