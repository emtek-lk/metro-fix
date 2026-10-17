import { StyleSheet } from 'react-native';
import { fontFamilyForWeight, withAppFont } from '../src/theme/fonts';

describe('fontFamilyForWeight', () => {
  it('maps the weights the app uses to the bundled families', () => {
    expect(fontFamilyForWeight('400')).toBe('Inter-Regular');
    expect(fontFamilyForWeight('500')).toBe('Inter-Medium');
    expect(fontFamilyForWeight('600')).toBe('Inter-SemiBold');
    expect(fontFamilyForWeight('700')).toBe('Inter-Bold');
    expect(fontFamilyForWeight('800')).toBe('Inter-ExtraBold');
  });

  it('treats no weight as regular and the keywords as their numbers', () => {
    expect(fontFamilyForWeight(undefined)).toBe('Inter-Regular');
    expect(fontFamilyForWeight('normal')).toBe('Inter-Regular');
    expect(fontFamilyForWeight('bold')).toBe('Inter-Bold');
  });

  it('snaps weights we do not ship to the nearest one', () => {
    expect(fontFamilyForWeight('300')).toBe('Inter-Regular');
    expect(fontFamilyForWeight('100')).toBe('Inter-Regular');
    expect(fontFamilyForWeight('900')).toBe('Inter-ExtraBold');
  });
});

describe('withAppFont', () => {
  const styles = StyleSheet.create({ title: { fontSize: 22, fontWeight: '800', color: 'red' }, plain: { fontSize: 14 } });

  it('on Android sets the family for the weight and drops fontWeight, keeping the rest', () => {
    expect(StyleSheet.flatten(withAppFont(styles.title, 'android'))).toEqual({
      fontSize: 22,
      color: 'red',
      fontFamily: 'Inter-ExtraBold',
    });
  });

  it('flattens a style array, later entries winning', () => {
    const out = StyleSheet.flatten(withAppFont([styles.plain, { fontWeight: '700' }, false, undefined], 'android'));
    expect(out).toEqual({ fontSize: 14, fontFamily: 'Inter-Bold' });
  });

  it('uses regular when no weight is given', () => {
    expect(StyleSheet.flatten(withAppFont(styles.plain, 'android'))).toEqual({ fontSize: 14, fontFamily: 'Inter-Regular' });
  });

  it('leaves a style alone when it names its own family', () => {
    const style = { fontFamily: 'Courier', fontWeight: '700' as const };
    expect(withAppFont(style, 'android')).toBe(style);
  });

  it('leaves styles untouched on iOS and web', () => {
    expect(withAppFont(styles.title, 'ios')).toBe(styles.title);
    expect(withAppFont(styles.title, 'web')).toBe(styles.title);
  });
});
