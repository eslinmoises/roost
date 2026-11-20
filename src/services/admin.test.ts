import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const { from, leaderboard } = vi.hoisted(() => ({ from: vi.fn(), leaderboard: vi.fn() }));
vi.mock('./supabase', () => ({ supabase: { from } }));
vi.mock('./leaderboard', () => ({ getGlobalLeaderboard: leaderboard }));
import { banUser, BAN_DURATIONS, getUserGrowth, getActivityStats, getTopContributors } from './admin';
import i18n from '@/i18n';

describe('admin dashboard data', () => {
  it('localizes ban duration labels while preserving the API duration values', async () => {
    await i18n.changeLanguage('es');
    expect(BAN_DURATIONS.map(duration => duration.value)).toEqual(['1 hour', '1 day', '7 days', '30 days', null]);
    expect(BAN_DURATIONS[0].label).toBe('1 hora');
    await i18n.changeLanguage('en');
    expect(BAN_DURATIONS[0].label).toBe('1 Hour');
  });
  describe.each(['es', 'en'])('ban persistence in %s', language => {
    it.each([
      ['1 hour', '2026-11-15T18:00:00.000Z'],
      ['1 day', '2026-11-16T17:00:00.000Z'],
      ['7 days', '2026-11-22T17:00:00.000Z'],
      ['30 days', '2026-12-15T17:00:00.000Z'],
    ])('stores the full interval for %s', async (interval, expiration) => {
      await i18n.changeLanguage(language);
      let saved: { ban_expires_at: string } | undefined;
      from.mockReturnValue({ update: (payload: { ban_expires_at: string }) => {
        saved = payload;
        return { eq: () => Promise.resolve({ error: null }) };
      } });
      await banUser('member', 'admin', 'Test reason', interval);
      expect(saved?.ban_expires_at).toBe(expiration);
    });
  });
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-15T17:00:00Z')); vi.clearAllMocks(); });
  afterEach(() => vi.useRealTimers());
  const query = (data: unknown[], error: Error | null = null) => {
    const chain = { select: vi.fn(), gte: vi.fn(), lte: vi.fn() };
    chain.select.mockReturnValue(chain); chain.gte.mockReturnValue(chain); chain.lte.mockResolvedValue({ data, error });
    return chain;
  };
  it('includes today and the complete first day in member growth', async () => {
    const chain = query([{ created_at: '2026-11-15T08:00:00Z' }, { created_at: '2026-10-17T01:00:00Z' }]);
    from.mockReturnValue(chain);
    const result = await getUserGrowth(30);
    expect(result).toHaveLength(30);
    expect(result[0]).toEqual({ date: '2026-10-17', count: 1 });
    expect(result[result.length - 1]).toEqual({ date: '2026-11-15', count: 1 });
    expect(chain.gte).toHaveBeenCalledWith('created_at', '2026-10-17T00:00:00.000Z');
  });
  it('includes current-day posts and comments in activity', async () => {
    from.mockReturnValue(query([{ created_at: '2026-11-15T08:00:00Z' }]));
    const result = await getActivityStats(30);
    expect(result).toHaveLength(30);
    expect(result[result.length - 1]).toEqual({ date: '2026-11-15', posts: 1, comments: 1 });
  });
  it('reports failed activity queries instead of showing false zeroes', async () => {
    from.mockReturnValue(query([], new Error('Database unavailable')));
    await expect(getActivityStats()).rejects.toThrow('Database unavailable');
  });
  it('uses rolling contributor totals and skips missing member profiles', async () => {
    const entry = { user: { id: 'maya' }, total_points: 20 };
    leaderboard.mockResolvedValue({ entries: [entry, { user: null, total_points: 50 }] });
    expect(await getTopContributors(5)).toEqual([entry]);
    expect(leaderboard).toHaveBeenCalledWith(30, 5);
  });
});
