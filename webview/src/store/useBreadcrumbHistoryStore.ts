import { create } from 'zustand';

export interface BreadcrumbStackItem {
  pathname: string;
  label: string;
  search?: Record<string, any>;
}

interface BreadcrumbHistoryState {
  stack: BreadcrumbStackItem[];
  pushRoute: (item: BreadcrumbStackItem, isLinkedTransition?: boolean) => void;
  popTo: (pathname: string) => void;
  resetTo: (item: BreadcrumbStackItem) => void;
}

const HOME_ITEM: BreadcrumbStackItem = { pathname: '/', label: 'Home' };

export const useBreadcrumbHistoryStore = create<BreadcrumbHistoryState>((set) => ({
  stack: [HOME_ITEM],

  pushRoute: (newItem, isLinkedTransition = false) => {
    set((state) => {
      // 1. If navigating to Home, reset stack to Home
      if (newItem.pathname === '/') {
        return { stack: [HOME_ITEM] };
      }

      // 2. Check if pathname already exists in current stack
      const existingIdx = state.stack.findIndex((s) => s.pathname === newItem.pathname);
      if (existingIdx !== -1) {
        // Unwind stack to existing item
        const updated = state.stack.slice(0, existingIdx + 1);
        updated[existingIdx] = newItem; // update search params
        return { stack: updated };
      }

      // 3. If linked transition (e.g. References -> Transformer)
      if (isLinkedTransition) {
        return { stack: [...state.stack, newItem] };
      }

      // 4. Top-level section change: Replace stack with [Home, newItem]
      return { stack: [HOME_ITEM, newItem] };
    });
  },

  popTo: (pathname) => {
    set((state) => {
      const idx = state.stack.findIndex((s) => s.pathname === pathname);
      if (idx !== -1) {
        return { stack: state.stack.slice(0, idx + 1) };
      }
      return state;
    });
  },

  resetTo: (item) => {
    set({ stack: item.pathname === '/' ? [HOME_ITEM] : [HOME_ITEM, item] });
  },
}));
