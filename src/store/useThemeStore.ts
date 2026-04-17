import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n/config';

export type Palette = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
};

type ThemeState = {
  isDark: boolean;
  language: string;
  palette: Palette;
  appName: string;
  appIconUrl: string | null; // null = use default Shield icon
  toggleTheme: () => void;
  setLanguage: (lang: string) => void;
  setPaletteColor: (shade: keyof Palette, color: string) => void;
  setAppName: (name: string) => void;
  setAppIcon: (url: string | null) => void;
};

const defaultPalette: Palette = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#059669',
  400: '#047857',
  500: '#064e3b',
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
      language: 'en',
      palette: defaultPalette,
      appName: 'baseapp',
      appIconUrl: null,
      toggleTheme: () =>
        set((state) => {
          const newTheme = !state.isDark;
          if (newTheme) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { isDark: newTheme };
        }),
      setLanguage: (lang: string) =>
        set(() => {
          i18n.changeLanguage(lang);
          return { language: lang };
        }),
      setPaletteColor: (shade: keyof Palette, color: string) =>
        set((state) => {
          const newPalette = { ...state.palette, [shade]: color };
          document.documentElement.style.setProperty(`--primary-${shade}`, color);
          return { palette: newPalette };
        }),
      setAppName: (name: string) => set({ appName: name }),
      setAppIcon: (url: string | null) => set({ appIconUrl: url }),
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          i18n.changeLanguage(state.language);
          if (state.palette) {
            Object.entries(state.palette).forEach(([shade, color]) => {
              document.documentElement.style.setProperty(`--primary-${shade}`, color as string);
            });
          }
        }
      },
    }
  )
);
