import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en/translation.json';
import it from '../locales/it/translation.json';
import fr from '../locales/fr/translation.json';
import es from '../locales/es/translation.json';
import zh from '../locales/zh/translation.json';
import ja from '../locales/ja/translation.json';
import ru from '../locales/ru/translation.json';

const resources = {
  en: { translation: en },
  it: { translation: it },
  fr: { translation: fr },
  es: { translation: es },
  zh: { translation: zh },
  ja: { translation: ja },
  ru: { translation: ru },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
