import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { type Palette, PREDEFINED_THEMES, DEFAULT_THEME } from '@/config/themes.config';

export type { Palette };

export const subscribeToTheme = () => {};
export const unsubscribeTheme = () => {};

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
  setThemeFromPreset: (themeId: string) => void;
  setAppName: (name: string) => void;
  setAppIcon: (url: string | null) => void;
  resetPalettes: () => void;
  loadUserTheme: (userId: string) => Promise<void>;
  saveUserTheme: (userId: string) => Promise<void>;
  _applyPalette: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
      language: 'en',
      lightPalette: DEFAULT_THEME.light,
      darkPalette: DEFAULT_THEME.dark,
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

      setThemeFromPreset: (themeId: string) => {
        const theme = PREDEFINED_THEMES.find(t => t.id === themeId);
        if (theme) {
          set({ lightPalette: theme.light, darkPalette: theme.dark });
          get()._applyPalette();
        }
      },
      
      setAppName: (name: string) => set({ appName: name }),
      setAppIcon: (url: string | null) => set({ appIconUrl: url }),

      resetPalettes: () => {
        set({ lightPalette: DEFAULT_THEME.light, darkPalette: DEFAULT_THEME.dark });
        get()._applyPalette();
      },

      loadUserTheme: async (userId: string) => {
        const snap = await getDoc(doc(db, 'userThemes', userId));
        if (snap.exists()) {
          const data = snap.data();
          set({
            lightPalette: data.lightPalette || DEFAULT_THEME.light,
            darkPalette: data.darkPalette || DEFAULT_THEME.dark,
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
        
        // Primary shades
        [50, 100, 200, 300, 400, 500].forEach(shade => {
          const color = activePalette[shade as keyof Palette];
          document.documentElement.style.setProperty(`--primary-${shade}`, color as string);
        });

        // Background, Surface, Text
        document.documentElement.style.setProperty('--bg-color', activePalette.bg);
        document.documentElement.style.setProperty('--surface-color', activePalette.surface);
        document.documentElement.style.setProperty('--text-color', activePalette.text);
        document.documentElement.style.setProperty('--text-muted', activePalette.textMuted);
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
