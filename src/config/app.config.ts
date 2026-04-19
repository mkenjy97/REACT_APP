export const APP_CONFIG = {
  name: 'App Factory',
  features: {
    hasMaps: true,
    hasChat: true,
    hasAuth: true,
    hasSupport: true,
    hasSearch: true,
    hasNotifications: true,
  },
  theme: {
    defaultMode: 'dark' as 'light' | 'dark',
    accentColor: 'primary',
    glassMode: true,
  },
  i18n: {
    defaultLanguage: 'it',
    supportedLanguages: ['it', 'en', 'es', 'fr', 'de'],
    fallbackLanguage: 'it',
  }
};

export type AppConfig = typeof APP_CONFIG;
