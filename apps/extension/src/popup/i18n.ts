import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en.js";
import { ja } from "./locales/ja.js";

export type TranslationKey = keyof typeof en;

const checkedJa: Record<TranslationKey, string> = ja;

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ja: { translation: checkedJa },
  },
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "ja"],
  interpolation: { escapeValue: false },
  initAsync: false,
  keySeparator: false,
  returnNull: false,
});

export default i18n;
