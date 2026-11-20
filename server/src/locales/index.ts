import english from './en.json';
import spanish from './es.json';

export function emailLocale(): 'es' | 'en' {
  return process.env.EMAIL_LOCALE?.toLowerCase().startsWith('en') ? 'en' : 'es';
}

export function emailText(key: keyof typeof english, values: Record<string, string | number> = {}): string {
  const dictionary = emailLocale() === 'es' ? spanish : english;
  // Replace once: user content containing braces must never become another variable.
  return dictionary[key].replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(values[name] ?? ''));
}
