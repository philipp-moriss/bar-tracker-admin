import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../../../localization/en.json';
import ru from '../../../localization/ru.json';
import he from '../../../localization/he.json';
import ar from '../../../localization/ar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      he: { translation: he },
      ar: { translation: ar }
    },
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    }
  });

// Функция для принудительной перезагрузки переводов
export const reloadTranslations = () => {
  i18n.reloadResources();
};

export default i18n; 