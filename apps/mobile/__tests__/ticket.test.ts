import { shortRef } from '../src/lib/ticket';

describe('shortRef', () => {
  it('is stable and has the requested length', () => {
    const id = 'A196433E-F36B-1410-8C67-00B2BC2CF9FE';
    expect(shortRef(id)).toBe(shortRef(id));
    expect(shortRef(id)).toHaveLength(6);
    expect(shortRef(id, 4)).toHaveLength(4);
    expect(shortRef(id)).toMatch(/^[0-9A-Z]{6}$/);
  });

  it('tells apart ids that share the same tail (sequential GUIDs)', () => {
    const tail = '-F36B-1410-8C67-00B2BC2CF9FE';
    const refs = ['A196433E', '9D96433E', '7196433E', '6E96433E', '6796433E', '6496433E'].map((head) =>
      shortRef(head + tail),
    );
    expect(new Set(refs).size).toBe(refs.length);
  });

  it('returns an empty string for missing ids', () => {
    expect(shortRef(undefined)).toBe('');
    expect(shortRef(null)).toBe('');
    expect(shortRef('')).toBe('');
  });
});
