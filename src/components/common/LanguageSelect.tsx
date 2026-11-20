import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { activeLanguage, selectLanguage } from '@/i18n';

export default function LanguageSelect() {
  const { t } = useTranslation('common');

  return (
    <label className="flex items-center justify-between gap-3 text-sm text-surface-700 dark:text-surface-200">
      <span className="flex items-center gap-2">
        <Globe className="h-4 w-4" aria-hidden="true" />
        {t('language')}
      </span>
      <select
        className="rounded-md border border-surface-300 bg-white px-2 py-1.5 text-sm dark:border-surface-600 dark:bg-surface-800"
        value={activeLanguage()}
        onChange={(event) => {
          const language = event.currentTarget.value;
          if (language === 'es' || language === 'en') void selectLanguage(language);
        }}
      >
        <option value="es" lang="es">{t('languageSpanish')}</option>
        <option value="en" lang="en">{t('languageEnglish')}</option>
      </select>
    </label>
  );
}
