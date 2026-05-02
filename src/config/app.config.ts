export const APP_CONFIG = {
  name: 'SpendLess',
  features: {
    hasMaps: false,
    hasChat: false,
    hasAuth: true,
    hasSupport: false,
    hasSearch: false,
    hasNotifications: false,
    hasBudget: true,
  },
  theme: {
    defaultMode: 'dark' as 'light' | 'dark',
    accentColor: 'emerald',
    glassMode: true,
  },
  i18n: {
    defaultLanguage: 'it',
    supportedLanguages: ['it', 'en'],
    fallbackLanguage: 'it',
  }
};

export type AppConfig = typeof APP_CONFIG;

