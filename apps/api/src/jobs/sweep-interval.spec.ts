import { offerSweepIntervalMs } from './jobs.service';

describe('offerSweepIntervalMs', () => {
  it('defaults to 5 seconds', () => {
    expect(offerSweepIntervalMs(undefined)).toBe(5000);
    expect(offerSweepIntervalMs('')).toBe(5000);
  });

  it('uses a configured number of seconds', () => {
    expect(offerSweepIntervalMs('60')).toBe(60000);
  });

  it('ignores nonsense and anything under a second', () => {
    expect(offerSweepIntervalMs('abc')).toBe(5000);
    expect(offerSweepIntervalMs('0')).toBe(5000);
    expect(offerSweepIntervalMs('-3')).toBe(5000);
  });
});
