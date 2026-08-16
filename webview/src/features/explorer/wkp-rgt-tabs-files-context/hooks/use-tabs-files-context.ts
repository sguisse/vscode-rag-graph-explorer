import { useExplorerStore } from '../../store/useExplorerStore';

export function useTabsFilesContext() {
  const rightPanelTab = useExplorerStore((s) => s.rightPanelTab);
  const setRightPanelTab = useExplorerStore((s) => s.setRightPanelTab);

  return {
    rightPanelTab,
    setRightPanelTab,
  };
}
