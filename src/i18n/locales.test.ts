import { describe, expect, it } from 'vitest';

const english = import.meta.glob('../locales/en/*.json', { eager: true, import: 'default' });
const spanish = import.meta.glob('../locales/es/*.json', { eager: true, import: 'default' });
function keys(value: unknown, prefix = ''): string[] {
  return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
    typeof item === 'string' ? [prefix + key] : keys(item, `${prefix}${key}.`)).sort();
}
describe('bundled translations', () => {
  it('ships Spanish and English with identical namespaces and keys', () => {
    const namespaces = Object.keys(english).map(p => p.split('/').pop());
    expect(namespaces.length).toBeGreaterThan(0);
    expect(Object.keys(spanish).map(p => p.split('/').pop()).sort()).toEqual(namespaces.sort());
    for (const [path, dictionary] of Object.entries(english)) {
      expect(keys(spanish[path.replace('/en/', '/es/')]), path).toEqual(keys(dictionary));
      const translated = spanish[path.replace('/en/', '/es/')] as Record<string, string>;
      for (const [key, value] of Object.entries(dictionary as Record<string, string>)) {
        const variables = (text: string) => [...text.matchAll(/\{\{([^},]+)(?:,[^}]+)?\}\}/g)].map(match => match[1]).sort();
        expect(variables(translated[key]), `${path}:${key}`).toEqual(variables(value));
      }
    }
  });
});
