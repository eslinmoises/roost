import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n, { t } from './index';
import { cleanupMessage, notificationCopy, pointActivityDescription } from './persisted';
import NotificationItem from '@/components/notifications/NotificationItem';
import CategoryFilter from '@/components/feed/CategoryFilter';
import CommentForm from '@/components/feed/CommentForm';
import PointActivityFeed from '@/components/leaderboard/PointActivityFeed';
import type { Notification } from '@/types';

vi.mock('@/services/supabase', () => ({ supabase: {} }));
vi.mock('@/services', () => ({ getUserPointActivities: vi.fn().mockResolvedValue([
  { id: 'stock', action_type: 'post_created', description: 'Created a new post', points: 10, created_at: '2026-11-20T12:00:00Z' },
  { id: 'custom', action_type: 'manual_adjustment', description: 'Original admin note', points: 3, created_at: '2026-11-20T12:00:00Z' },
]) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null, profile: null }) }));
beforeEach(async () => { await i18n.changeLanguage('es'); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('persisted system copy', () => {
  it.each([
    ['new_message', 'New message from Ana', 'Nuevo mensaje de Ana'],
    ['new_comment', 'Ana commented on your post', 'Ana comentó en tu publicación'],
    ['comment_reply', 'Ana replied to your comment', 'Ana respondió a tu comentario'],
    ['new_reaction', 'Ana reacted to your post', 'Ana reaccionó a tu publicación'],
    ['new_reaction', 'Ana reacted to your comment', 'Ana reaccionó a tu comentario'],
    ['new_reaction', 'Ana reacted to your showcase', 'Ana reaccionó a tu proyecto de la vitrina'],
    ['mention', 'Ana mentioned you', 'Ana te mencionó'],
    ['new_follower', 'Ana started following you', 'Ana empezó a seguirte'],
    ['new_message', 'Subscription Cancelled', 'Suscripción cancelada'],
    ['new_message', 'Payment Failed', 'Pago fallido'],
  ])('translates %s stock titles and preserves excerpts', async (type, title, expected) => {
    expect(notificationCopy(type, title, 'User text stays as written')).toEqual({ title: expected, message: 'User text stays as written' });
    await i18n.changeLanguage('en');
    expect(notificationCopy(type, title).title).toBe(title);
  });
  it('renders a real stored notification in Spanish', () => {
    render(<NotificationItem notification={{ type: 'new_message', title: 'New message from Ana', message: 'Original excerpt', created_at: new Date().toISOString() } as Notification} onClick={vi.fn()} />);
    expect(screen.getByText('Nuevo mensaje de Ana')).toBeTruthy();
    expect(screen.getByText('Original excerpt')).toBeTruthy();
  });
  it('renders generated activity descriptions while preserving manual notes', async () => {
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
    render(<PointActivityFeed userId="member" />);
    expect(await screen.findByText('Creó una nueva publicación')).toBeTruthy();
    expect(screen.getByText('Original admin note')).toBeTruthy();
  });
  it('supports old localized mentions and fixed billing bodies without translating custom text', async () => {
    await i18n.changeLanguage('en');
    expect(notificationCopy('mention', 'Nueva mención', 'Ana te mencionó en un comentario')).toEqual({ title: 'New Mention', message: 'Ana mentioned you in a comment' });
    await i18n.changeLanguage('es');
    expect(notificationCopy('new_message', 'Subscription Expired', 'Your subscription has expired. Please renew to regain premium access.').message).toBe('Tu suscripción venció. Renuévala para recuperar el acceso premium.');
    expect(notificationCopy('new_comment', 'My original title', 'User excerpt')).toEqual({ title: 'My original title', message: 'User excerpt' });
  });
  it.each([
    ['post_created', 'Created a new post', 'Creó una nueva publicación'],
    ['comment_created', 'Created a new comment', 'Creó un nuevo comentario'],
    ['reaction_given', 'Gave a reaction', 'Dio una reacción'],
    ['event_attended', "RSVP'd to an event", 'Confirmó su asistencia a un evento'],
    ['showcase_approved', 'Showcase approved: My App', 'Proyecto aprobado en la vitrina: My App'],
  ])('translates the stored %s description', (type, description, expected) => {
    expect(pointActivityDescription(type, description, 'fallback')).toBe(expected);
    expect(pointActivityDescription('manual_adjustment', 'Custom adjustment', 'fallback')).toBe('Custom adjustment');
  });
  it('localizes subscription cleanup outcomes and plural forms', async () => {
    expect(cleanupMessage('No expired subscriptions to process')).toBe('No hay suscripciones vencidas por procesar');
    expect(cleanupMessage('Processed 1 expired subscriptions')).toBe('Se procesó 1 suscripción vencida');
    expect(cleanupMessage('Processed 2 expired subscriptions')).toBe('Se procesaron 2 suscripciones vencidas');
    await i18n.changeLanguage('en');
    expect(cleanupMessage('Processed 2 expired subscriptions')).toBe('Processed 2 expired subscriptions');
  });
  it('uses singular counts for members, attendees and lessons', () => {
    expect(t('common:memberTotal', { count: 1 })).toBe('1 miembro');
    expect(t('events:attendingCount', { count: 1, maybe: '' })).toBe('1 asistirá');
    expect(t('classroom:lessonProgress', { value1: 1, count: 1 })).toBe('· 1/1 lección');
    expect(t('admin:posts', { count: 1 })).toBe('1 publicación');
    expect(t('admin:minutesAgo', { count: 1 })).toBe('Hace 1 minuto');
    expect(t('leaderboard:outOfUsers', { count: 1 })).toBe('de 1 usuario');
  });
});
it('renders feed sort controls and the default comment action in Spanish', () => {
  render(<><CategoryFilter categories={[]} selectedCategoryId={null} onSelectCategory={vi.fn()} onSortChange={vi.fn()} /><CommentForm onSubmit={vi.fn()} /></>);
  expect(screen.getByRole('button', { name: 'Publicar' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Más recientes' }));
  expect(screen.getByText('Populares')).toBeTruthy();
  expect(screen.getByText('Tendencias')).toBeTruthy();
});
