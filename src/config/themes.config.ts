export type Palette = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
};

export interface AppTheme {
  id: string;
  name: string;
  light: Palette;
  dark: Palette;
}

/**
 * PREDEFINED_THEMES
 * Refined for WCAG 2.1 Accessibility & Visual Depth
 */
export const PREDEFINED_THEMES: AppTheme[] = [
  {
    id: 'emerald',
    name: 'Emerald',
    light: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      bg: '#f1f5f9', // Light Gray-Blue for better card contrast
      surface: '#ffffff',
      text: '#064e3b',
      textMuted: '#4b5563',
    },
    dark: {
      50: '#064e3b',
      100: '#065f46',
      200: '#047857',
      300: '#059669',
      400: '#10b981',
      500: '#34d399',
      bg: '#022c22',
      surface: '#064e3b',
      text: '#f0fdf4',
      textMuted: '#94a3b8',
    }
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    light: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      bg: '#f0f4f8',
      surface: '#ffffff',
      text: '#1e3a8a',
      textMuted: '#4b5563',
    },
    dark: {
      50: '#1e3a8a',
      100: '#1e40af',
      200: '#1d4ed8',
      300: '#2563eb',
      400: '#3b82f6',
      500: '#60a5fa',
      bg: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      textMuted: '#94a3b8',
    }
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    light: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      bg: '#f5f3ff',
      surface: '#ffffff',
      text: '#4c1d95',
      textMuted: '#4b5563',
    },
    dark: {
      50: '#4c1d95',
      100: '#5b21b6',
      200: '#6d28d9',
      300: '#7c3aed',
      400: '#8b5cf6',
      500: '#a78bfa',
      bg: '#1e1b4b',
      surface: '#312e81',
      text: '#f5f3ff',
      textMuted: '#a78bfa',
    }
  },
  {
    id: 'orange',
    name: 'Sunset Orange',
    light: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      bg: '#fff7ed',
      surface: '#ffffff',
      text: '#7c2d12',
      textMuted: '#57534e',
    },
    dark: {
      50: '#7c2d12',
      100: '#9a3412',
      200: '#c2410c',
      300: '#ea580c',
      400: '#f97316',
      500: '#fb923c',
      bg: '#291b15',
      surface: '#431407',
      text: '#fff7ed',
      textMuted: '#fdba74',
    }
  },
  {
    id: 'rose',
    name: 'Rose Pink',
    light: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      bg: '#fff1f2',
      surface: '#ffffff',
      text: '#881337',
      textMuted: '#4b5563',
    },
    dark: {
      50: '#881337',
      100: '#9f1239',
      200: '#be123c',
      300: '#e11d48',
      400: '#f43f5e',
      500: '#fb7185',
      bg: '#310a11',
      surface: '#4c0519',
      text: '#fff1f2',
      textMuted: '#fda4af',
    }
  },
  {
    id: 'slate',
    name: 'Modern Slate',
    light: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      bg: '#f1f5f9',
      surface: '#ffffff',
      text: '#0f172a',
      textMuted: '#475569',
    },
    dark: {
      50: '#0f172a',
      100: '#1e293b',
      200: '#334155',
      300: '#475569',
      400: '#64748b',
      500: '#94a3b8',
      bg: '#020617',
      surface: '#0f172a',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
    }
  }
];

export const DEFAULT_THEME = PREDEFINED_THEMES[0];
