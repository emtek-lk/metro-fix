import { relativeTime } from '../src/lib/time';

const NOW = new Date('2026-10-03T12:00:00Z').getTime();
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe('relativeTime', () => {
  it('uses short relative units', () => {
    expect(relativeTime(ago(20_000), NOW)).toBe('just now');
    expect(relativeTime(ago(12 * 60_000), NOW)).toBe('12m ago');
    expect(relativeTime(ago(3 * 3_600_000), NOW)).toBe('3h ago');
    expect(relativeTime(ago(2 * 86_400_000), NOW)).toBe('2d ago');
  });

  it('switches to a date after a week', () => {
    expect(relativeTime(ago(9 * 86_400_000), NOW)).toBe(
      new Date(NOW - 9 * 86_400_000).toLocaleDateString(),
    );
  });

  it('accepts Date objects', () => {
    expect(relativeTime(new Date(NOW - 5 * 60_000), NOW)).toBe('5m ago');
  });

  it('never throws on missing, invalid or future values', () => {
    expect(relativeTime(undefined, NOW)).toBe('');
    expect(relativeTime(null, NOW)).toBe('');
    expect(relativeTime('not a date', NOW)).toBe('');
    expect(relativeTime(new Date(NOW + 3_600_000), NOW)).toBe(
      new Date(NOW + 3_600_000).toLocaleDateString(),
    );
  });
});
