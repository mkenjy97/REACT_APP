import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

export const subscribeToTheme = () => {};
export const unsubscribeTheme = () => {};

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
  lightPalette: Palette;
  darkPalette: Palette;
  appName: string;
  appIconUrl: string | null;
  toggleTheme: () => void;
  setLanguage: (lang: string) => void;
  setPaletteColor: (mode: 'light' | 'dark', shade: keyof Palette, color: string) => void;
  setAppName: (name: string) => void;
  setAppIcon: (url: string | null) => void;
  resetPalettes: () => void;
  loadUserTheme: (userId: string) => Promise<void>;
  saveUserTheme: (userId: string) => Promise<void>;
  _applyPalette: () => void;
};

const defaultLightPalette: Palette = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981',
};

const defaultDarkPalette: Palette = {
  50: '#0f2722',
  100: '#134e3a',
  200: '#065f46',
  300: '#047857',
  400: '#059669',
  500: '#34d399',
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
      language: 'en',
      lightPalette: defaultLightPalette,
      darkPalette: defaultDarkPalette,
      appName: 'SpendLess',
      appIconUrl: null,
      
      toggleTheme: () => {
        const newTheme = !get().isDark;
        set({ isDark: newTheme });
        if (newTheme) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        get()._applyPalette();
      },
        
      setLanguage: (lang: string) =>
        set(() => {
          i18n.changeLanguage(lang);
          return { language: lang };
        }),
        
      setPaletteColor: (mode, shade, color) => {
        if (mode === 'light') {
          const newPalette = { ...get().lightPalette, [shade]: color };
          set({ lightPalette: newPalette });
        } else {
          const newPalette = { ...get().darkPalette, [shade]: color };
          set({ darkPalette: newPalette });
        }
        get()._applyPalette();
      },
      
      setAppName: (name: string) => set({ appName: name }),
      setAppIcon: (url: string | null) => set({ appIconUrl: url }),

      resetPalettes: () => {
        set({ lightPalette: defaultLightPalette, darkPalette: defaultDarkPalette });
        get()._applyPalette();
      },

      loadUserTheme: async (userId: string) => {
        const snap = await getDoc(doc(db, 'userThemes', userId));
        if (snap.exists()) {
          const data = snap.data();
          set({
            lightPalette: data.lightPalette || defaultLightPalette,
            darkPalette: data.darkPalette || defaultDarkPalette,
          });
          get()._applyPalette();
        }
      },

      saveUserTheme: async (userId: string) => {
        await setDoc(doc(db, 'userThemes', userId), {
          lightPalette: get().lightPalette,
          darkPalette: get().darkPalette,
        }, { merge: true });
      },

      _applyPalette: () => {
        const { isDark, lightPalette, darkPalette } = get();
        const activePalette = isDark ? darkPalette : lightPalette;
        Object.entries(activePalette).forEach(([shade, color]) => {
          document.documentElement.style.setProperty(`--primary-${shade}`, color as string);
        });
      }
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ 
        isDark: state.isDark, 
        language: state.language,
        lightPalette: state.lightPalette,
        darkPalette: state.darkPalette
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          i18n.changeLanguage(state.language);
          state._applyPalette();
        }
      },
    }
  )
);
