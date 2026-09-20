import { useBookmarksStore } from '../store/useBookmarksStore';

export const useBookmarksState = () => {
  const { tabs, activeTabId, currentUser, globalSettings } = useBookmarksStore();

  const activeTab = tabs.find(t => t.id === activeTabId);

  const visibleCards = (activeTab?.cards || []).filter(c => {
    if (globalSettings.hidePrivate && c.isPrivate) return false;
    if (c.isPrivate && c.owner !== currentUser.id) return false;
    return true;
  });

  return { activeTab, visibleCards, globalSettings, currentUser };
};
