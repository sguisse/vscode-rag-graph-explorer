import { create } from 'zustand';
import { BookmarkTab, GlobalSettings, User } from '../types/bookmarks.types';
import initialData from '../data/initialBookmarks.json';

interface BookmarksState {
  tabs: BookmarkTab[];
  activeTabId: string;
  currentUser: User;
  globalSettings: GlobalSettings;
  isDarkMode: boolean;
  isZenMode: boolean;
  isSidebarOpen: boolean;
  setTabs: (tabs: BookmarkTab[] | ((prev: BookmarkTab[]) => BookmarkTab[])) => void;
  setActiveTabId: (id: string) => void;
  setCurrentUser: (user: User) => void;
  setGlobalSettings: (settings: Partial<GlobalSettings> | ((prev: GlobalSettings) => GlobalSettings)) => void;
  toggleDarkMode: () => void;
  toggleZenMode: () => void;
  toggleSidebar: () => void;
}

const defaultGlobalSettings: GlobalSettings = {
  nbCols: 4,
  nbRowsMax: 10,
  rowHeight: 130,
  gapX: 16,
  gapY: 16,
  showGridLines: true,
  cardsCollisionAlgo: 'Grid',
  defaultBookmarkDisplayMode: 'compact',
  defaultCardHeaderBgColor: '#312e81',
  defaultCardHeaderTextColor: '#ffffff',
  hidePrivate: false,
};

export const useBookmarksStore = create<BookmarksState>((set) => ({
  tabs: initialData.INITIAL_TABS as BookmarkTab[],
  activeTabId: initialData.INITIAL_TABS[0]?.id || 'tab_frontend',
  currentUser: initialData.INITIAL_USERS[0] as User,
  globalSettings: defaultGlobalSettings,
  isDarkMode: true,
  isZenMode: false,
  isSidebarOpen: true,

  setTabs: (tabs) => set((state) => ({
    tabs: typeof tabs === 'function' ? tabs(state.tabs) : tabs
  })),
  setActiveTabId: (id) => set({ activeTabId: id }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setGlobalSettings: (settings) => set((state) => ({
    globalSettings: typeof settings === 'function' ? settings(state.globalSettings) : { ...state.globalSettings, ...settings }
  })),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
