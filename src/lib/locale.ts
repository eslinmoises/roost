import { format as dateFormat, formatDistanceToNow as distanceToNow } from 'date-fns';
import type { FormatOptions, FormatDistanceToNowOptions } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { activeLanguage } from '@/i18n';

export const dateLocale = () => activeLanguage() === 'es' ? es : enUS;
export function formatNumber(value: number | null | undefined, options?: Intl.NumberFormatOptions) {
  return value == null ? '' : new Intl.NumberFormat(activeLanguage(), options).format(value);
}
export function format(date: Parameters<typeof dateFormat>[0], pattern: string, options?: FormatOptions) {
  const spanishPatterns: Record<string, string> = {
    'EEEE, MMMM d, yyyy': "EEEE, d 'de' MMMM 'de' yyyy",
    'MMM d, h:mm a': 'd MMM, HH:mm',
    'h:mm a': 'HH:mm',
  };
  return dateFormat(date, activeLanguage() === 'es' ? spanishPatterns[pattern] ?? pattern : pattern, { ...options, locale: dateLocale() });
}
export function formatDistanceToNow(date: Parameters<typeof distanceToNow>[0], options?: FormatDistanceToNowOptions) {
  return distanceToNow(date, { ...options, locale: dateLocale() });
}
