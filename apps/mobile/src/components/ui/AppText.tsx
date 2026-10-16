import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';

/**
 * Largest factor the system text size may scale our text by. Beyond this the fixed-width layouts
 * (tab bar, segmented controls, card headers) start to break, so text keeps growing with the
 * user's setting up to here and then stops. Individual elements can pass a lower cap.
 */
export const MAX_FONT_SCALE = 1.5;

/**
 * Drop-in replacement for React Native's `Text` that caps system text scaling. (`defaultProps`
 * cannot do this: React 19 ignores it on function components.)
 */
export const Text = React.forwardRef<RNText, TextProps>(function AppText(
  { maxFontSizeMultiplier = MAX_FONT_SCALE, ...props },
  ref,
) {
  return <RNText ref={ref} maxFontSizeMultiplier={maxFontSizeMultiplier} {...props} />;
});
