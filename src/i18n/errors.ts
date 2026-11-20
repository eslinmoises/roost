import i18n, { activeLanguage, t } from './index';

// Translate presentation only: error codes and strings used by auth logic stay intact.
export function localizeError(message: string | null | undefined): string {
  if (!message) return '';
  if (activeLanguage() === 'en') return message;
  for (const namespace of Object.keys(i18n.store.data.en ?? {})) {
    for (const language of ['es', 'en']) {
      const dictionary = i18n.getResourceBundle(language, namespace) as Record<string, string>;
      for (const [key, value] of Object.entries(dictionary)) {
        if (value === message) return language === 'es' ? message : t(`${namespace}:${key}`);
        if (!value.includes('{{')) continue;
        const original = i18n.getResource('en', namespace, key) as string;
        if (!/error|fail|invalid|too large|exceeds|must|cannot|not |required|not found|no longer|read-only|denied/i.test(original)) continue;
        const names: string[] = [];
        const pattern = value.split(/(\{\{[^}]+\}\})/).map(part => {
          if (part.startsWith('{{')) { names.push(part.slice(2, -2).split(',')[0].trim()); return '(.*?)'; }
          return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }).join('');
        const match = message.match(new RegExp(`^${pattern}$`));
        if (match) return language === 'es' ? message : t(`${namespace}:${key}`, Object.fromEntries(names.map((name, index) => [name, match[index + 1]])));
      }
    }
  }
  return t('errors:unexpected');
}
