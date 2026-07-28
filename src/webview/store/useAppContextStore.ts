import { create } from 'zustand';

export interface AppContextState {
  activeFeature: string;
  themeMode: 'dark' | 'light';
  isDarkMode: boolean;
  notification: string | null;

  setActiveFeature: (feature: string) => void;
  setThemeMode: (mode: 'dark' | 'light') => void;
  setIsDarkMode: (isDarkMode: boolean) => void;
  toggleThemeMode: () => void;
  setNotification: (notification: string | null) => void;
}

export const useAppContextStore = create<AppContextState>((set) => ({
  activeFeature: 'feature-home',
  themeMode: 'light',
  isDarkMode: false,
  notification: null,

  setActiveFeature: (activeFeature) => set({ activeFeature }),
  setThemeMode: (themeMode) =>
    set({
      themeMode,
      isDarkMode: themeMode === 'dark',
    }),
  setIsDarkMode: (isDarkMode) =>
    set({
      isDarkMode,
      themeMode: isDarkMode ? 'dark' : 'light',
    }),
  toggleThemeMode: () =>
    set((state) => {
      const nextIsDark = !state.isDarkMode;
      return {
        isDarkMode: nextIsDark,
        themeMode: nextIsDark ? 'dark' : 'light',
      };
    }),
  setNotification: (notification) => set({ notification }),
}));
