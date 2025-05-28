import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import ru from "./locales/ru.json";
import en from "./locales/en.json";
import uk from "./locales/uk.json";
import de from "./locales/de.json";

const resources = {
  ru: { translation: ru },
  en: { translation: en },
  uk: { translation: uk },
  de: { translation: de },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "ru",
    debug: false,

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
