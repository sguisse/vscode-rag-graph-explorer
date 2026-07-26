import { AppLayoutContainers } from '../types';

export function useLayoutState(containers: AppLayoutContainers) {
  const showHeader = containers?.header?.visible ?? true;
  const showLeftSidebar = containers?.sidebarLeft?.visible ?? true;
  const showCtnWkpTop = containers?.workspace?.top?.visible ?? false;
  const showCtnWkpLeft = containers?.workspace?.left?.visible ?? false;
  const showCtnWkpCenter = containers?.workspace?.center?.visible ?? true;
  const showCtnWkpRight = containers?.workspace?.right?.visible ?? false;
  const showCtnWkpBottom = containers?.workspace?.bottom?.visible ?? false;
  const showRightSidebar = containers?.sidebarRight?.visible ?? false;
  const showFooter = containers?.footer?.visible ?? true;

  return {
    showHeader,
    showLeftSidebar,
    showCtnWkpTop,
    showCtnWkpLeft,
    showCtnWkpCenter,
    showCtnWkpRight,
    showCtnWkpBottom,
    showRightSidebar,
    showFooter,
  };
}
