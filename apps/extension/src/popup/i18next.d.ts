import 'i18next';

import type { en } from './locales/en.js';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    returnNull: false;
    resources: {
      translation: typeof en;
    };
  }
}
