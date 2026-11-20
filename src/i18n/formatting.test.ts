import { afterEach, describe, expect, it } from 'vitest';
import moment from 'moment';
import i18n, { t } from './index';
import { format, formatDistanceToNow } from '@/lib/locale';
import { APP_CONFIG } from '@/config/app';
import { SHOWCASE_CATEGORY_INFO } from '@/types/showcase';

afterEach(async () => { await i18n.changeLanguage('es'); });
describe('active locale formatting', () => {
  it('formats dates and relative dates in the selected language', async () => {
    await i18n.changeLanguage('es');
    expect(format(new Date(2026, 10, 20), 'MMMM')).toBe('noviembre');
    expect(formatDistanceToNow(new Date(), { addSuffix: true })).toContain('hace');
    expect(moment.locale()).toBe('es');
    await i18n.changeLanguage('en');
    expect(format(new Date(2026, 10, 20), 'MMMM')).toBe('November');
    expect(formatDistanceToNow(new Date(), { addSuffix: true })).toContain('ago');
    expect(moment.locale()).toBe('en');
  });
  it('keeps default configuration and display metadata responsive to the language', async () => {
    await i18n.changeLanguage('es');
    expect(SHOWCASE_CATEGORY_INFO.web_app.label).toBe('Aplicación web');
    expect(APP_CONFIG.tagline).toBe('Aprende, construye y crece en comunidad');
    await i18n.changeLanguage('en');
    expect(SHOWCASE_CATEGORY_INFO.web_app.label).toBe('Web App');
    expect(APP_CONFIG.tagline).toBe('Learn, Build, Grow Together');
  });
  it('uses Spanish and English plural forms without English suffix concatenation', async () => {
    await i18n.changeLanguage('es');
    expect(t('posts:imageAttached', { count: 1 })).toBe('1 imagen adjunta');
    expect(t('posts:imageAttached', { count: 2 })).toBe('2 imágenes adjuntas');
    await i18n.changeLanguage('en');
    expect(t('posts:imageAttached', { count: 1 })).toBe('1 image attached');
    expect(t('posts:imageAttached', { count: 2 })).toBe('2 images attached');
  });
});
