import { blendOver, parseColor } from '../src/lib/color';

describe('parseColor', () => {
  it('reads hex, rgb and rgba', () => {
    expect(parseColor('#0F172A')).toEqual({ r: 15, g: 23, b: 42, a: 1 });
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor('rgb(10, 20, 30)')).toEqual({ r: 10, g: 20, b: 30, a: 1 });
    expect(parseColor('rgba(249, 115, 22, 0.16)')).toEqual({ r: 249, g: 115, b: 22, a: 0.16 });
  });

  it('returns null for what it cannot read', () => {
    expect(parseColor('transparent')).toBeNull();
    expect(parseColor('not a colour')).toBeNull();
  });
});

describe('blendOver', () => {
  it('returns the base for a fully transparent colour and the top for a fully opaque one', () => {
    expect(blendOver('rgba(255, 0, 0, 0)', '#000000')).toBe('#000000');
    expect(blendOver('rgba(255, 0, 0, 1)', '#000000')).toBe('#ff0000');
  });

  it('mixes by alpha', () => {
    expect(blendOver('rgba(255, 255, 255, 0.5)', '#000000')).toBe('#808080');
  });

  it('falls back to the base when it cannot parse', () => {
    expect(blendOver('transparent', '#102030')).toBe('#102030');
    expect(blendOver('rgba(1,2,3,0.5)', 'nonsense')).toBe('nonsense');
  });
});
