import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import moment from 'moment';
import 'moment/locale/es';

type AppLanguage = 'es' | 'en';
const LANGUAGE_STORAGE_KEY = 'roost-language';

function savedLanguage(): AppLanguage | undefined {
  try {
    const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return value === 'es' || value === 'en' ? value : undefined;
  } catch {
    return undefined;
  }
}

const dictionaries = import.meta.glob('../locales/*/*.json', { eager: true, import: 'default' });
const resources: Record<string, Record<string, Record<string, string>>> = {};
for (const [path, dictionary] of Object.entries(dictionaries)) {
  const [, language, namespace] = path.match(/\/locales\/([^/]+)\/([^/]+)\.json$/)!;
  (resources[language] ??= {})[namespace] = dictionary as Record<string, string>;
}

export function activeLanguage(): AppLanguage {
  return i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'es';
}

export function selectLanguage(language: AppLanguage) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Language switching still works when the browser blocks storage.
  }
  return i18n.changeLanguage(language);
}

function syncLanguage() {
  const language = activeLanguage();
  moment.locale(language);
  if (typeof document !== 'undefined') document.documentElement.lang = language;
}

const interpolation = {
  escapeValue: false,
  alwaysFormat: true,
  format: (value: unknown) => typeof value === 'number' ? new Intl.NumberFormat(activeLanguage()).format(value) : value === false ? '' : String(value ?? ''),
};

void i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage() ?? (import.meta.env.VITE_DEFAULT_LOCALE || 'es'),
  fallbackLng: 'en',
  supportedLngs: ['es', 'en'],
  load: 'languageOnly',
  defaultNS: 'common',
  ns: Object.keys(resources.en ?? {}),
  initAsync: false,
  interpolation,
});
i18n.on('languageChanged', syncLanguage);
syncLanguage();

// Helpers and services share the same instance as React's useTranslation hook.
export const t = i18n.t.bind(i18n);
export default i18n;
