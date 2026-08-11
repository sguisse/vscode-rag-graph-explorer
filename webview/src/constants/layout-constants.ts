export interface ContainerSize {
    min: number;
    max: number;
    default: number;
}

export interface SidebarLeftContainerSize extends ContainerSize {
    minimized: number;
}

// Used to compute the left padding of the center content in the header, so that it is aligned with the left content of the sidebar left container
export const headerLeftWidth = 210;

export const DefaultContainersSize = {
  headerHeight: 40,

  sidebarLeftWidth: 220,
  sidebarLeftMinimizedWidth: 56,

  workspaceTopHeight: 100,
  workspaceLeftWidth: 280,
  workspaceRightWidth: 280,
  workspaceBottomHeight: 40,

  sidebarRightWidth: 260,

  footerHeight: 40,

} as const;
