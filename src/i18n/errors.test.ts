import { afterEach, expect, it } from 'vitest';
import i18n from './index';
import { localizeError } from './errors';

afterEach(async () => { await i18n.changeLanguage('es'); });
it('translates auth failures without changing the original English error', async () => {
  await i18n.changeLanguage('es');
  expect(localizeError('Invalid login credentials')).toBe('El correo o la contraseña no son correctos.');
  expect(localizeError('Failed to save post')).toBe('No se pudo guardar la publicación');
  await i18n.changeLanguage('en');
  expect(localizeError('Invalid login credentials')).toBe('Invalid login credentials');
});
it('keeps unknown remote errors readable in the active language', async () => {
  await i18n.changeLanguage('es');
  expect(localizeError('unexpected upstream error xyz')).toBe('No se pudo completar la operación. Inténtalo de nuevo.');
  expect(localizeError('upstream service exploded, please retry')).toBe('No se pudo completar la operación. Inténtalo de nuevo.');
});
