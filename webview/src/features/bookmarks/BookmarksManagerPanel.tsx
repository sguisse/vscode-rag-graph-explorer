import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useBookmarksStore } from './store/useBookmarksStore';
import { BookmarksHeader } from './components/BookmarksHeader';
import { BookmarksToolBar } from './components/BookmarksToolBar';
import { BookmarksTabList } from './components/tabs/BookmarksTabList';
import { BookmarksPanel } from './components/BookmarksPanel';
import { SidebarRightPanel } from './components/sidebar/SidebarRightPanel';
import { BookmarkCard, BookmarkTab, Bookmark } from './types/bookmarks.types';
import { CardConfigDialog } from './components/dialogs/CardConfigDialog';
import { TabConfigDialog } from './components/dialogs/TabConfigDialog';
import { GlobalConfigDialog } from './components/dialogs/GlobalConfigDialog';
import { BookmarkDialog } from './components/dialogs/BookmarkDialog';
import { ShareSnapshotModal } from './components/dialogs/ShareSnapshotModal';
import { OmniSearchModal } from './components/OmniSearchModal';
import { ReaderViewDrawer } from './components/ReaderViewDrawer';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ConfirmDeleteModal } from './components/dialogs/ConfirmDeleteModal';
import { AuditHistoryModal } from './components/dialogs/AuditHistoryModal';
import { DuplicateResolverModal } from './components/dialogs/DuplicateResolverModal';
import { useAiCategorizer } from './hooks/useAiCategorizer';

export const BookmarksManagerPanel: React.FC = () => {
  const {
    tabs,
    setTabs,
    activeTabId,
    setActiveTabId,
    globalSettings,
    setGlobalSettings,
    isZenMode,
    toggleZenMode,
    currentUser
  } = useBookmarksStore();

  const { generateDomainClusters } = useAiCategorizer();

  const [isGlobalConfigOpen, setIsGlobalConfigOpen] = useState(false);
  const [isOmniOpen, setIsOmniOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [readerBookmark, setReaderBookmark] = useState<Bookmark | null>(null);
  const [editingCard, setEditingCard] = useState<BookmarkCard | null>(null);
  const [editingTab, setEditingTab] = useState<BookmarkTab | null>(null);
  const [confirmDeleteState, setConfirmDeleteState] = useState<{
    isOpen: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  const [bookmarkDialogState, setBookmarkDialogState] = useState<{
    isOpen: boolean;
    cardId: string | null;
    bookmark: Bookmark | null;
    isUrlEditableOnly?: boolean;
  }>({
    isOpen: false,
    cardId: null,
    bookmark: null,
    isUrlEditableOnly: false
  });

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const handleAddNewCard = () => {
    const newCard: BookmarkCard = {
      id: `card_${Date.now()}`,
      name: 'New Bookmark Section',
      tabId: activeTabId,
      description: '',
      isPrivate: false,
      owner: currentUser.id,
      bookmarkDisplayMode: 'compact',
      position: {
        x: (activeTab.cards.length * 2) % globalSettings.nbCols,
        y: Math.floor((activeTab.cards.length * 2) / globalSettings.nbCols) * 2,
        w: 2,
        h: 2
      },
      locks: {
        cardLocks: { lockedPosition: false, lockedSize: false, lockedName: false, lockedDeletion: false },
        bookmarkLocks: { editable: true, reorderable: true, urlEditableOnly: false, removable: true, addable: true }
      },
      headerStyle: {
        backgroundColor: globalSettings.defaultCardHeaderBgColor,
        textColor: globalSettings.defaultCardHeaderTextColor
      },
      contentStyle: { backgroundColor: '', borderStyle: 'solid', borderColor: '#6366f1' },
      badges: [],
      bookmarks: []
    };

    setTabs(prevTabs => prevTabs.map(tab => {
      if (tab.id !== activeTabId) return tab;
      return { ...tab, cards: [...tab.cards, newCard] };
    }));
  };

  const handleAiSmartGroup = () => {
    if (!activeTab) return;
    const allTabBookmarks: Bookmark[] = [];
    activeTab.cards.forEach(c => allTabBookmarks.push(...c.bookmarks));

    const newCards = generateDomainClusters(allTabBookmarks, activeTabId, currentUser, globalSettings.nbCols);
    setTabs(prevTabs => prevTabs.map(tab => {
      if (tab.id !== activeTabId) return tab;
      return { ...tab, cards: newCards };
    }));
  };

  const handleSaveCardConfig = (updatedCard: BookmarkCard) => {
    setTabs(prevTabs => prevTabs.map(tab => {
      if (tab.id !== activeTabId) return tab;
      return {
        ...tab,
        cards: tab.cards.map(c => c.id === updatedCard.id ? updatedCard : c)
      };
    }));
  };

  const handleDeleteCard = (card: BookmarkCard) => {
    setConfirmDeleteState({
      isOpen: true,
      title: 'Delete Section Card',
      message: `Are you sure you want to delete card "${card.name} and all of its ${card.bookmarks.length} bookmark(s)?`,
      confirmText: 'Delete Card',
      onConfirm: () => {
        setTabs(prevTabs => prevTabs.map(tab => {
          if (tab.id !== activeTabId) return tab;
          return { ...tab, cards: tab.cards.filter(c => c.id !== card.id) };
        }));
        setConfirmDeleteState(null);
      }
    });
  };

  const handleRequestDeleteTab = (tab: BookmarkTab) => {
    if (tabs.length <= 1) return;
    setConfirmDeleteState({
      isOpen: true,
      title: 'Delete Workspace Tab',
      message: `Are you sure you want to delete tab "${tab.name} and all of its ${tab.cards?.length || 0} section card(s)?`,
      confirmText: 'Delete Tab',
      onConfirm: () => {
        setTabs(prev => {
          const next = prev.filter(t => t.id !== tab.id);
          if (activeTabId === tab.id && next.length > 0) {
            setActiveTabId(next[0].id);
          }
          return next;
        });
        setConfirmDeleteState(null);
      }
    });
  };

  const handleOpenAddBookmark = (cardId: string) => {
    setBookmarkDialogState({
      isOpen: true,
      cardId,
      bookmark: null,
      isUrlEditableOnly: false
    });
  };

  const handleOpenEditBookmark = (cardId: string, bookmark: Bookmark) => {
    const card = activeTab.cards.find(c => c.id === cardId);
    const isUrlOnly = card?.locks.bookmarkLocks.urlEditableOnly || false;
    setBookmarkDialogState({
      isOpen: true,
      cardId,
      bookmark,
      isUrlEditableOnly: isUrlOnly
    });
  };

  const handleSaveBookmark = (bmData: any) => {
    const { cardId, bookmark } = bookmarkDialogState;
    if (!cardId) return;

    setTabs(prevTabs => prevTabs.map(tab => {
      if (tab.id !== activeTabId) return tab;
      return {
        ...tab,
        cards: tab.cards.map(card => {
          if (card.id !== cardId) return card;
          if (bookmark) {
            return {
              ...card,
              bookmarks: card.bookmarks.map(b => b.id === bookmark.id ? { ...b, ...bmData } : b)
            };
          } else {
            const newBm: Bookmark = {
              id: `bm_${Date.now()}`,
              name: bmData.name || 'New Link',
              description: bmData.description || '',
              url: bmData.url,
              icon: bmData.icon || 'Globe',
              iconType: bmData.iconType || 'lucide',
              tags: bmData.tags || [],
              isPrivate: bmData.isPrivate || false,
              isLocked: bmData.isLocked || false,
              owner: currentUser.id,
              healthStatus: 'healthy',
              clickCount: 0,
              createdAt: Date.now()
            };
            return { ...card, bookmarks: [...card.bookmarks, newBm] };
          }
        })
      };
    }));
  };

  const handleDeleteBookmark = (cardId: string, bookmarkId: string) => {
    const targetCard = activeTab?.cards.find(c => c.id === cardId);
    const targetBookmark = targetCard?.bookmarks.find(b => b.id === bookmarkId);
    const bmName = targetBookmark?.name || 'this bookmark';

    setConfirmDeleteState({
      isOpen: true,
      title: 'Delete Bookmark',
      message: `Are you sure you want to delete "${bmName}?`,
      confirmText: 'Delete Bookmark',
      onConfirm: () => {
        setTabs(prevTabs => prevTabs.map(tab => {
          if (tab.id !== activeTabId) return tab;
          return {
            ...tab,
            cards: tab.cards.map(card => {
              if (card.id !== cardId) return card;
              return { ...card, bookmarks: card.bookmarks.filter(b => b.id !== bookmarkId) };
            })
          };
        }));
        setConfirmDeleteState(null);
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden">
      {!isZenMode && (
        <BookmarksHeader
          onOpenGlobalConfig={() => setIsGlobalConfigOpen(true)}
          onOpenOmniSearch={() => setIsOmniOpen(true)}
          onOpenAnalytics={() => setIsAnalyticsOpen(true)}
          onOpenAuditHistory={() => setIsAuditOpen(true)}
          onOpenDuplicateResolver={() => setIsDuplicateOpen(true)}
        />
      )}

      {isZenMode && (
        <div className="fixed top-3 right-3 z-50 animate-in fade-in">
          <button
            type="button"
            onClick={toggleZenMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 text-white backdrop-blur-md shadow-xl text-xs font-medium hover:bg-slate-800"
          >
            <X className="w-3.5 h-3.5"/>
            <span>Exit Zen Mode</span>
          </button>
        </div>
      )}

      {!isZenMode && (
        <BookmarksToolBar
          onAiGroup={handleAiSmartGroup}
          onShare={() => setIsShareOpen(true)}
        />
      )}

      {!isZenMode && (
        <BookmarksTabList
          onOpenTabConfig={() => setEditingTab(activeTab)}
          onRequestDeleteTab={handleRequestDeleteTab}
        />
      )}

      <div className="flex-1 flex min-h-0 relative">
        <BookmarksPanel
          onEditCard={(c) => setEditingCard(c)}
          onDeleteCard={handleDeleteCard}
          onAddBookmark={handleOpenAddBookmark}
          onEditBookmark={handleOpenEditBookmark}
          onDeleteBookmark={handleDeleteBookmark}
          onOpenReader={(bm) => setReaderBookmark(bm)}
          onAddNewCard={handleAddNewCard}
        />
        {!isZenMode && <SidebarRightPanel/>}
      </div>

      <GlobalConfigDialog
        isOpen={isGlobalConfigOpen}
        settings={globalSettings}
        onClose={() => setIsGlobalConfigOpen(false)}
        onSave={(newSettings) => setGlobalSettings(newSettings)}
      />

      <OmniSearchModal
        isOpen={isOmniOpen}
        tabs={tabs}
        onClose={() => setIsOmniOpen(false)}
        onSelectBookmark={(bm) => setReaderBookmark(bm)}
        hidePrivate={globalSettings.hidePrivate}
        currentUser={currentUser}
      />

      <ReaderViewDrawer
        bookmark={readerBookmark}
        onClose={() => setReaderBookmark(null)}
      />

      <CardConfigDialog
        card={editingCard}
        isOpen={Boolean(editingCard)}
        onClose={() => setEditingCard(null)}
        onSave={handleSaveCardConfig}
      />

      <TabConfigDialog
        tab={editingTab}
        isOpen={Boolean(editingTab)}
        globalSettings={globalSettings}
        onClose={() => setEditingTab(null)}
        onSave={(updated) => setTabs(tabs.map(t => t.id === updated.id ? updated : t))}
      />

      <BookmarkDialog
        isOpen={bookmarkDialogState.isOpen}
        bookmark={bookmarkDialogState.bookmark}
        isUrlEditableOnly={bookmarkDialogState.isUrlEditableOnly}
        onClose={() => setBookmarkDialogState({ isOpen: false, cardId: null, bookmark: null, isUrlEditableOnly: false })}
        onSave={handleSaveBookmark}
      />

      <ShareSnapshotModal
        isOpen={isShareOpen}
        tab={activeTab}
        onClose={() => setIsShareOpen(false)}
      />

      <AnalyticsDashboard
        isOpen={isAnalyticsOpen}
        tabs={tabs}
        onClose={() => setIsAnalyticsOpen(false)}
        hidePrivate={globalSettings.hidePrivate}
        currentUser={currentUser}
      />

      <AuditHistoryModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />

      <DuplicateResolverModal
        isOpen={isDuplicateOpen}
        onClose={() => setIsDuplicateOpen(false)}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(confirmDeleteState?.isOpen)}
        title={confirmDeleteState?.title}
        message={confirmDeleteState?.message}
        confirmText={confirmDeleteState?.confirmText}
        onConfirm={() => confirmDeleteState?.onConfirm()}
        onClose={() => setConfirmDeleteState(null)}
      />
    </div>
  );
};

export default BookmarksManagerPanel;
