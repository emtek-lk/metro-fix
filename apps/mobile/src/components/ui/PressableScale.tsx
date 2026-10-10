import React, { useCallback, useRef, useState } from 'react';
import { Animated, Platform, Pressable, type PressableProps } from 'react-native';
import { useReduceMotion } from '../../theme/useReduceMotion';
import { EASE_OUT, PRESS_SCALE, duration } from '../../theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends PressableProps {
  /** Scale the control settles at while pressed. */
  scaleTo?: number;
}

/**
 * A Pressable that shrinks slightly the instant a finger lands and returns on release, so the
 * control reads as physical. Feedback starts on press-in (not when the tap completes), runs on the
 * native thread, and is skipped when the user asks for reduced motion. A control's own press
 * styling (colour, opacity) still applies on top.
 */
export const PressableScale: React.FC<PressableScaleProps> = ({
  scaleTo = PRESS_SCALE,
  onPressIn,
  onPressOut,
  disabled,
  style,
  ...rest
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  // An animated component cannot take a function style, so the pressed state is tracked here and
  // the style is resolved before it is handed over.
  const [pressed, setPressed] = useState(false);
  const reduceMotion = useReduceMotion();

  const animateTo = useCallback(
    (toValue: number) => {
      if (reduceMotion) return;
      Animated.timing(scale, {
        toValue,
        duration: duration.press,
        easing: EASE_OUT,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    },
    [scale, reduceMotion],
  );

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) animateTo(scaleTo);
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateTo(1);
        setPressed(false);
        onPressOut?.(event);
      }}
      style={[typeof style === 'function' ? style({ pressed }) : style, { transform: [{ scale }] }]}
    />
  );
};
