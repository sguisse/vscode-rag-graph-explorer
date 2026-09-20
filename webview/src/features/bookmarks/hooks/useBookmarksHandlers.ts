import { useBookmarksStore } from '../store/useBookmarksStore';
import { Bookmark, BookmarkCard } from '../types/bookmarks.types';

export const useBookmarksHandlers = () => {
  const { tabs, setTabs, activeTabId } = useBookmarksStore();

  const addBookmark = (cardId: string, bookmark: Bookmark) => {
    setTabs(tabs.map(tab => {
      if (tab.id !== activeTabId) return tab;
      return {
        ...tab,
        cards: tab.cards.map(card => {
          if (card.id !== cardId) return card;
          return { ...card, bookmarks: [...card.bookmarks, bookmark] };
        })
      };
    }));
  };

  const updateBookmark = (cardId: string, bookmarkId: string, updates: Partial<Bookmark>) => {
    setTabs(tabs.map(tab => {
      if (tab.id !== activeTabId) return tab;
      return {
        ...tab,
        cards: tab.cards.map(card => {
          if (card.id !== cardId) return card;
          return {
            ...card,
            bookmarks: card.bookmarks.map(bm => bm.id === bookmarkId ? { ...bm, ...updates } : bm)
          };
        })
      };
    }));
  };

  const deleteBookmark = (cardId: string, bookmarkId: string) => {
    setTabs(tabs.map(tab => {
      if (tab.id !== activeTabId) return tab;
      return {
        ...tab,
        cards: tab.cards.map(card => {
          if (card.id !== cardId) return card;
          return { ...card, bookmarks: card.bookmarks.filter(bm => bm.id !== bookmarkId) };
        })
      };
    }));
  };

  const updateCard = (cardId: string, updates: Partial<BookmarkCard>) => {
    setTabs(tabs.map(tab => {
      if (tab.id !== activeTabId) return tab;
      return {
        ...tab,
        cards: tab.cards.map(card => card.id === cardId ? { ...card, ...updates } as BookmarkCard : card)
      };
    }));
  };

  return { addBookmark, updateBookmark, deleteBookmark, updateCard };
};
