// Type-safe t() — augments react-i18next with our resource shape so keys autocomplete and typos fail
// to compile (e.g. t('map.title') is valid, t('map.tite') is a type error).
import 'react-i18next';

import type { Resources } from './locales/en';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: Resources;
    };
  }
}
