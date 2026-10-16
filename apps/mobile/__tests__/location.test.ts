import { formatPlace } from '../src/services/location';

describe('formatPlace', () => {
  it('joins the street and the city', () => {
    expect(formatPlace({ street: 'Galle Road', city: 'Colombo' })).toBe('Galle Road, Colombo');
  });

  it('prefers a named place over the street', () => {
    expect(formatPlace({ name: 'Skyline Towers', street: 'Galle Road', city: 'Colombo' })).toBe(
      'Skyline Towers, Colombo',
    );
  });

  it('does not repeat a value that appears twice', () => {
    expect(formatPlace({ name: 'Colombo', city: 'Colombo' })).toBe('Colombo');
  });

  it('falls back through district, subregion and region', () => {
    expect(formatPlace({ district: 'Fort', subregion: 'Colombo District' })).toBe('Fort, Colombo District');
    expect(formatPlace({ region: 'Western Province' })).toBe('Western Province');
  });

  it('returns null when there is nothing to show', () => {
    expect(formatPlace(null)).toBeNull();
    expect(formatPlace(undefined)).toBeNull();
    expect(formatPlace({})).toBeNull();
    expect(formatPlace({ name: '  ', city: null })).toBeNull();
  });
});
