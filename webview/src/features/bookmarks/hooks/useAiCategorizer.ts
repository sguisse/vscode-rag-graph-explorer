import { useCallback } from 'react';
import { Bookmark, BookmarkCard } from '../types/bookmarks.types';

export const useAiCategorizer = () => {
  const generateDomainClusters = useCallback((bookmarks: Bookmark[], activeTabId: string, currentUser: any, nbCols: number): BookmarkCard[] => {
    const domainClusters: Record<string, Bookmark[]> = {};

    bookmarks.forEach(bm => {
      try {
        const host = new URL(bm.url).hostname;
        domainClusters[host] = domainClusters[host] || [];
        domainClusters[host].push(bm);
      } catch (e) {
        domainClusters['other'] = domainClusters['other'] || [];
        domainClusters['other'].push(bm);
      }
    });

    return Object.entries(domainClusters).map(([host, bms], idx) => ({
      id: `card_cluster_${Date.now()}_${idx}`,
      name: `${host.replace('www.', '').toUpperCase()} Cluster`,
      tabId: activeTabId,
      description: `Auto-clustered bookmarks for ${host}`,
      isPrivate: false,
      owner: currentUser.id,
      position: {
        x: (idx * 2) % nbCols,
        y: Math.floor((idx * 2) / nbCols) * 2,
        w: 2,
        h: 2
      },
      locks: {
        cardLocks: { lockedPosition: false, lockedSize: false, lockedName: false, lockedDeletion: false },
        bookmarkLocks: { editable: true, reorderable: true, urlEditableOnly: false, removable: true, addable: true }
      },
      headerStyle: { backgroundColor: '#1e1b4b', textColor: '#a5b4fc' },
      contentStyle: { backgroundColor: '', borderStyle: 'solid', borderColor: '#4338ca' },
      badges: [{ id: `b_${idx}`, name: 'AI Clustered', backgroundColor: '#e0e7ff', textColor: '#3730a3', icon: 'Sparkles', iconType: 'lucide' }],
      bookmarks: bms
    }));
  }, []);

  return { generateDomainClusters };
};
