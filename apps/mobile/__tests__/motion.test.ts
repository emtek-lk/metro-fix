import { appleSpring, PRESS_SCALE } from '../src/theme/motion';

describe('appleSpring', () => {
  it('converts response and damping ratio to stiffness and damping', () => {
    const { stiffness, damping, mass } = appleSpring(0.3, 0.8);
    expect(mass).toBe(1);
    expect(stiffness).toBeCloseTo(438.65, 1);
    expect(damping).toBeCloseTo(2 * 0.8 * Math.sqrt(stiffness), 5);
  });

  it('is critically damped (no overshoot) at a ratio of 1', () => {
    const { stiffness, damping } = appleSpring(0.4, 1);
    expect(damping).toBeCloseTo(2 * Math.sqrt(stiffness), 5);
  });

  it('keeps press feedback subtle', () => {
    expect(PRESS_SCALE).toBeGreaterThan(0.95);
    expect(PRESS_SCALE).toBeLessThan(1);
  });
});
