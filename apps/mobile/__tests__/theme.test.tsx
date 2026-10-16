import React from 'react';
import { StyleSheet, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { colors } from '../src/theme/colors';
import { darkPalette, lightPalette, palettes } from '../src/theme/palettes';
import { getColorScheme, setColorScheme } from '../src/theme/themeState';
import { themedStyles } from '../src/theme/themedStyles';
import { elevation } from '../src/theme/elevation';
import { getStatusColor } from '../src/theme/status';
import { JobStatus } from '@metro-fix/core-types';
import { ThemeProvider, ThemeBoundary, useTheme } from '../src/theme/ThemeProvider';

afterEach(() => setColorScheme('dark'));

describe('palettes', () => {
  it('define exactly the same tokens in light and dark', () => {
    expect(Object.keys(lightPalette).sort()).toEqual(Object.keys(darkPalette).sort());
  });

  it('differ where they should (surfaces and text) and share the semantic hues', () => {
    expect(lightPalette.bg).not.toBe(darkPalette.bg);
    expect(lightPalette.text).not.toBe(darkPalette.text);
    expect(lightPalette.white).toBe(darkPalette.white);
  });
});

describe('colors', () => {
  it('resolves tokens against the active scheme at read time', () => {
    setColorScheme('dark');
    expect(colors.bg).toBe(palettes.dark.bg);
    setColorScheme('light');
    expect(colors.bg).toBe(palettes.light.bg);
  });

  it('supports spreading and key enumeration', () => {
    setColorScheme('light');
    expect({ ...colors }.text).toBe(lightPalette.text);
    expect(Object.keys(colors)).toContain('brand');
  });
});

describe('themedStyles', () => {
  it('builds once per scheme and follows the active scheme', () => {
    const factory = jest.fn(() => StyleSheet.create({ box: { backgroundColor: colors.bg } }));
    const styles = themedStyles(factory);

    setColorScheme('dark');
    expect(styles.box.backgroundColor).toBe(darkPalette.bg);
    expect(styles.box.backgroundColor).toBe(darkPalette.bg);
    expect(factory).toHaveBeenCalledTimes(1);

    setColorScheme('light');
    expect(styles.box.backgroundColor).toBe(lightPalette.bg);
    expect(factory).toHaveBeenCalledTimes(2);

    setColorScheme('dark');
    expect(styles.box.backgroundColor).toBe(darkPalette.bg);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});

describe('theme-aware lookups', () => {
  it('uses softer shadows in light mode', () => {
    setColorScheme('dark');
    const dark = elevation.e2.shadowOpacity;
    setColorScheme('light');
    expect(elevation.e2.shadowOpacity).toBeLessThan(dark);
  });

  it('keeps status colours following the theme instead of freezing the first one', () => {
    setColorScheme('dark');
    expect(getStatusColor(JobStatus.COMPLETED)).toBe(darkPalette.success);
    setColorScheme('light');
    expect(getStatusColor(JobStatus.COMPLETED)).toBe(lightPalette.success);
  });
});

describe('ThemeProvider', () => {
  const Probe = () => {
    const { scheme, preference, setPreference } = useTheme();
    // Always switch to the opposite scheme, whatever the test environment's system scheme is.
    const opposite = scheme === 'light' ? 'dark' : 'light';
    return (
      <>
        <Text onPress={() => setPreference(opposite)}>{`scheme:${scheme} pref:${preference}`}</Text>
        <Text>{`bg:${colors.bg}`}</Text>
      </>
    );
  };

  it('applies a chosen preference and remounts the tree below the boundary', async () => {
    let mounts = 0;
    const Counter = () => {
      React.useEffect(() => {
        mounts += 1;
      }, []);
      return null;
    };

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <ThemeBoundary>
            <Probe />
            <Counter />
          </ThemeBoundary>
        </ThemeProvider>,
      );
    });
    expect(mounts).toBe(1);

    const label = () => JSON.stringify(renderer.toJSON());
    const before = getColorScheme();
    const after = before === 'light' ? 'dark' : 'light';
    expect(label()).toContain(`scheme:${before} pref:system`);
    expect(label()).toContain(`bg:${palettes[before].bg}`);

    await ReactTestRenderer.act(async () => {
      renderer.root.findAllByType(Text)[0].props.onPress();
    });
    expect(label()).toContain(`scheme:${after} pref:${after}`);
    expect(label()).toContain(`bg:${palettes[after].bg}`);
    expect(mounts).toBe(2);
  });
});
