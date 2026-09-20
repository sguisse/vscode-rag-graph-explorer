import { useCallback } from 'react';
import { BookmarkTab, Bookmark } from '../types/bookmarks.types';

export const useDuplicateDetector = () => {
  const findDuplicates = useCallback((tabs: BookmarkTab[]) => {
    const urlMap = new Map<string, { tabId: string, cardId: string, bookmark: Bookmark }[]>();

    tabs.forEach(tab => {
      tab.cards.forEach(card => {
        card.bookmarks.forEach(bm => {
          const normUrl = bm.url.trim().toLowerCase();
          const existing = urlMap.get(normUrl) || [];
          existing.push({ tabId: tab.id, cardId: card.id, bookmark: bm });
          urlMap.set(normUrl, existing);
        });
      });
    });

    const duplicates = Array.from(urlMap.entries()).filter(([_, entries]) => entries.length > 1);
    return duplicates;
  }, []);

  return { findDuplicates };
};
