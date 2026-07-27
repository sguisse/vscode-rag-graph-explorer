export interface ContainerSize {
    min: number;
    max: number;
    default: number;
}

export interface SidebarLeftContainerSize extends ContainerSize {
    minimized: number;
}

export const DefaultContainersSize = {
  headerHeight: 40,

  sidebarLeftWidth: 220,
  sidebarLeftMinimizedWidth: 56,

  workspaceTopHeight: 100,
  workspaceLeftWidth: 280,
  workspaceRightWidth: 280,
  workspaceBottomHeight: 40,

  sidebarRightWidth: 260,

  footerHeight: 100,

} as const;
