import { secondsUntil, formatCountdown, fractionLeft } from '../src/lib/countdown';

const NOW = new Date('2026-10-03T12:00:00Z').getTime();

describe('secondsUntil', () => {
  it('counts whole seconds, rounding up', () => {
    expect(secondsUntil(new Date(NOW + 90_000), NOW)).toBe(90);
    expect(secondsUntil(new Date(NOW + 89_100), NOW)).toBe(90);
    expect(secondsUntil(new Date(NOW + 1), NOW)).toBe(1);
  });

  it('accepts ISO strings', () => {
    expect(secondsUntil('2026-10-03T12:01:00Z', NOW)).toBe(60);
  });

  it('is never negative and treats missing or bad deadlines as already over', () => {
    expect(secondsUntil(new Date(NOW - 5000), NOW)).toBe(0);
    expect(secondsUntil(null, NOW)).toBe(0);
    expect(secondsUntil(undefined, NOW)).toBe(0);
    expect(secondsUntil('nonsense', NOW)).toBe(0);
  });
});

describe('formatCountdown', () => {
  it('formats m:ss', () => {
    expect(formatCountdown(90)).toBe('1:30');
    expect(formatCountdown(75)).toBe('1:15');
    expect(formatCountdown(5)).toBe('0:05');
    expect(formatCountdown(0)).toBe('0:00');
    expect(formatCountdown(-3)).toBe('0:00');
  });
});

describe('fractionLeft', () => {
  it('runs from 1 to 0 and stays in range', () => {
    expect(fractionLeft(90, 90)).toBe(1);
    expect(fractionLeft(45, 90)).toBe(0.5);
    expect(fractionLeft(0, 90)).toBe(0);
    expect(fractionLeft(120, 90)).toBe(1);
    expect(fractionLeft(-1, 90)).toBe(0);
    expect(fractionLeft(10, 0)).toBe(0);
  });
});

describe('long offer windows', () => {
  it('switches to h:mm:ss from an hour up', () => {
    const { formatCountdown } = require('../src/lib/countdown');
    expect(formatCountdown(3599)).toBe('59:59');
    expect(formatCountdown(3600)).toBe('1:00:00');
    expect(formatCountdown(9 * 3600)).toBe('9:00:00');
  });
});
