import { useExplorerStore } from '../../store/useExplorerStore';

export function useTabsPrompt() {
  const activeTab = useExplorerStore((s) => s.promptTab);
  const setActiveTab = useExplorerStore((s) => s.setPromptTab);

  return {
    activeTab,
    setActiveTab,
  };
}
