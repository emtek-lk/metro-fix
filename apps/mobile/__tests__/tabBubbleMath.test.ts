import {
  bubbleLeftForFinger,
  stretchForVelocity,
  tabIndexAt,
  tabLeft,
  tabWidth,
} from '../src/components/ui/tabBubbleMath';

// A 4-tab bar with 400px of room → 100px per tab.
const four = { innerWidth: 400, count: 4 };

describe('tabWidth / tabLeft', () => {
  it('splits the track evenly', () => {
    expect(tabWidth(four)).toBe(100);
    expect([0, 1, 2, 3].map((i) => tabLeft(i, four))).toEqual([0, 100, 200, 300]);
  });

  it('is safe before the bar has been measured', () => {
    expect(tabWidth({ innerWidth: 0, count: 4 })).toBe(0);
    expect(tabIndexAt(50, { innerWidth: 0, count: 4 })).toBe(0);
  });

  it('is safe with no tabs', () => {
    expect(tabWidth({ innerWidth: 400, count: 0 })).toBe(0);
  });
});

describe('tabIndexAt', () => {
  it('maps a touch to the tab under it', () => {
    expect(tabIndexAt(10, four)).toBe(0);
    expect(tabIndexAt(150, four)).toBe(1);
    expect(tabIndexAt(299, four)).toBe(2);
    expect(tabIndexAt(399, four)).toBe(3);
  });

  it('uses the boundary for the tab on its right', () => {
    expect(tabIndexAt(100, four)).toBe(1);
  });

  it('clamps touches beyond either edge', () => {
    expect(tabIndexAt(-60, four)).toBe(0);
    expect(tabIndexAt(900, four)).toBe(3);
  });

  it('works for a two-tab bar', () => {
    const two = { innerWidth: 300, count: 2 };
    expect(tabIndexAt(149, two)).toBe(0);
    expect(tabIndexAt(151, two)).toBe(1);
  });
});

describe('bubbleLeftForFinger', () => {
  it('centres the bubble on the finger', () => {
    expect(bubbleLeftForFinger(200, four)).toBe(150);
  });

  it('keeps the bubble inside the track at both ends', () => {
    expect(bubbleLeftForFinger(0, four)).toBe(0);
    expect(bubbleLeftForFinger(-80, four)).toBe(0);
    expect(bubbleLeftForFinger(400, four)).toBe(300);
    expect(bubbleLeftForFinger(900, four)).toBe(300);
  });
});

describe('stretchForVelocity', () => {
  it('grows with speed in either direction and is capped', () => {
    expect(stretchForVelocity(0)).toBe(0);
    expect(stretchForVelocity(0.2)).toBeCloseTo(0.09);
    expect(stretchForVelocity(-0.2)).toBeCloseTo(0.09);
    expect(stretchForVelocity(5)).toBe(0.28);
  });
});
