/* eslint-disable import/no-named-as-default-member */
// i18n boundary — English + Turkish. Device language is detected via expo-localization; the user's
// explicit choice is persisted in AsyncStorage. Import this module once (side-effect init) before the
// component tree renders (done in app/_layout.tsx). Resources are bundled (no async backend).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './locales/en';
import { tr } from './locales/tr';

export const SUPPORTED_LANGUAGES = ['en', 'tr'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = 'petrodrivers.language';
const DEFAULT_LANGUAGE: Language = 'en';

function isSupported(code: string | null | undefined): code is Language {
  return code === 'en' || code === 'tr';
}

function deviceLanguage(): Language {
  const code = getLocales()[0]?.languageCode;
  return isSupported(code) ? code : DEFAULT_LANGUAGE;
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tr: { translation: tr },
  },
  lng: deviceLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
});

// Apply a previously saved override (async — resolves after first paint; useTranslation re-renders).
void AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
  if (isSupported(saved) && saved !== i18n.language) {
    void i18n.changeLanguage(saved);
  }
});

/** Change language and persist the choice. */
export async function setLanguage(lng: Language): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, lng);
  await i18n.changeLanguage(lng);
}

export function currentLanguage(): Language {
  return isSupported(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
}

export default i18n;
