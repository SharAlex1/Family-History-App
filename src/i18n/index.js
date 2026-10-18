import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./ru.json";
import en from "./en.json";
export const LANGUAGE_KEY = "familyAtlas.language";
export const LANGUAGES = ["en", "ru"];
function initialLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return LANGUAGES.includes(saved) ? saved : "en";
  } catch {
    return "en";
  }
}
i18n.use(initReactI18next).init({
  lng: initialLanguage(),
  fallbackLng: "en",
  supportedLngs: LANGUAGES,
  resources: { en: { translation: en }, ru: { translation: ru } },
  keySeparator: false,
  nsSeparator: false,
  initImmediate: false,
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});
function documentLanguage() {
  if (typeof document !== "undefined") {
    document.documentElement.lang = i18n.resolvedLanguage || i18n.language;
    document.title = i18n.language === "ru" ? "Семейный атлас" : "Family Atlas";
  }
}
i18n.on("languageChanged", documentLanguage);
documentLanguage();
// Only pass interface messages here; archive content is rendered verbatim.
const messages = new Map();
export function tr(message, values) {
  if (typeof message !== "string") return message;
  const trimmed = message.trim();
  if (!trimmed) return message;
  const previous = messages.get(trimmed);
  const key = previous?.key || trimmed;
  const parameters = values || previous?.values;
  const translated = i18n.t(key, { defaultValue: key, ...parameters });
  // Shared controls may receive an already translated label; retain its key so
  // existing feedback can follow a later language change without touching data.
  messages.set(translated, { key, values: parameters });
  if (messages.size > 2000) messages.delete(messages.keys().next().value);
  return (
    message.slice(0, message.indexOf(trimmed)) +
    translated +
    message.slice(message.indexOf(trimmed) + trimmed.length)
  );
}
export const locale = () => (i18n.language === "ru" ? "ru-RU" : "en-US");
export const formatDate = (date, options) =>
  new Date(date).toLocaleDateString(locale(), options);
export default i18n;

export function countText(key, count) {
  return tr(key, { count });
}
