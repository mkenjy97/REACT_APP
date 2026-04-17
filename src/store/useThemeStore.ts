import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n/config';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';

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
  appIconUrl: string | null;
  toggleTheme: () => void;
  setLanguage: (lang: string) => void;
  setPaletteColor: (shade: keyof Palette, color: string) => void;
  setAppName: (name: string) => void;
  setAppIcon: (url: string | null) => void;
  resetPalette: () => void;
  _setSettingsFromCloud: (settings: { palette?: Palette; appName?: string; appIconUrl?: string | null }) => void;
};

const defaultPalette: Palette = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#059669',
  400: '#047857',
  500: '#064e3b',
};

// Listeners status
let unsubTheme: (() => void) | null = null;

export const subscribeToTheme = () => {
  if (unsubTheme) return; // already subscribed
  const themeRef = doc(db, 'globalSettings', 'theme');
  unsubTheme = onSnapshot(themeRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      useThemeStore.getState()._setSettingsFromCloud({
        palette: data.palette,
        appName: data.appName,
        appIconUrl: data.appIconUrl,
      });
      // Apply CSS variables
      if (data.palette) {
        Object.entries(data.palette).forEach(([shade, color]) => {
          document.documentElement.style.setProperty(`--primary-${shade}`, color as string);
        });
      }
    }
  });
};

export const unsubscribeTheme = () => {
  if (unsubTheme) {
    unsubTheme();
    unsubTheme = null;
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
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
        
      setPaletteColor: (shade: keyof Palette, color: string) => {
        const currentPalette = get().palette;
        const newPalette = { ...currentPalette, [shade]: color };
        set({ palette: newPalette });
        document.documentElement.style.setProperty(`--primary-${shade}`, color);
        // Persist to Firebase
        setDoc(doc(db, 'globalSettings', 'theme'), { palette: newPalette }, { merge: true });
      },
      
      setAppName: (name: string) => {
        set({ appName: name });
        // Persist to Firebase
        setDoc(doc(db, 'globalSettings', 'theme'), { appName: name }, { merge: true });
      },
      
      setAppIcon: (url: string | null) => {
        set({ appIconUrl: url });
        // Persist to Firebase
        setDoc(doc(db, 'globalSettings', 'theme'), { appIconUrl: url }, { merge: true });
      },

      resetPalette: () => {
        set({ palette: defaultPalette });
        Object.entries(defaultPalette).forEach(([shade, color]) => {
          document.documentElement.style.setProperty(`--primary-${shade}`, color);
        });
        setDoc(doc(db, 'globalSettings', 'theme'), { palette: defaultPalette }, { merge: true });
      },

      _setSettingsFromCloud: (settings) => {
        set((state) => ({
          palette: settings.palette ?? state.palette,
          appName: settings.appName ?? state.appName,
          appIconUrl: settings.appIconUrl !== undefined ? settings.appIconUrl : state.appIconUrl,
        }));
      }
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ isDark: state.isDark, language: state.language }), // only persist local user prefs locally
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          i18n.changeLanguage(state.language);
        }
      },
    }
  )
);
