import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/layout';
import { themedStyles } from '../../theme/themedStyles';
import { useReduceMotion } from '../../theme/useReduceMotion';
import { haptics } from '../../lib/haptics';
import { Icon, type FeatherIconName } from './Icon';
import { GlassSurface } from './GlassSurface';
import { TabBubble } from './TabBubble';
import {
  bubbleLeftForFinger,
  stretchForVelocity,
  tabIndexAt,
  tabLeft,
  tabWidth,
} from './tabBubbleMath';

export interface TabItem {
  id: string;
  label: string;
  icon: string;
}

export interface FloatingTabBarProps {
  activeTab: string;
  onTabPress: (tabId: string) => void;
  tabs?: TabItem[];
}

const DEFAULT_TABS: TabItem[] = [
  { id: 'jobs', label: 'Roster', icon: 'home' },
  { id: 'history', label: 'History', icon: 'clipboard' },
  { id: 'alerts', label: 'Alerts', icon: 'bell' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

/** Horizontal and vertical padding between the glass edge and the tabs. */
const PAD = spacing.sm;
const TAB_HEIGHT = layout.tabBarHeight - PAD * 2;
/** How far the bubble swells while a finger is down. */
const PRESS_SCALE = 1.14;
/** How much the lit tab's icon is magnified, as if seen through the lens. */
const LIT_ICON_SCALE = 1.16;
/** Furthest the lens highlight slides against the drag direction (px). */
const MAX_LEAN = 8;

/**
 * Floating glass tab bar with a sliding "bubble" under the active tab.
 *
 * Touch anywhere on the bar and the bubble swells and springs to that tab; drag and it follows the
 * finger (stretching slightly with speed), lighting each tab as it passes; lift and it settles on
 * the nearest tab and selects it. Screen readers get a plain tab list and activate tabs directly.
 */
export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  activeTab,
  onTabPress,
  tabs = DEFAULT_TABS,
}) => {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const activeIndex = Math.max(
    tabs.findIndex((tab) => tab.id === activeTab),
    0,
  );

  const trackRef = useRef<View>(null);
  const trackPageX = useRef(0);
  const [trackWidth, setTrackWidth] = useState(0);
  /** The tab under the finger while touching; null when idle. */
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const geometry = useMemo(
    () => ({ innerWidth: Math.max(trackWidth - PAD * 2, 0), count: tabs.length }),
    [trackWidth, tabs.length],
  );
  const bubbleWidth = tabWidth(geometry);

  const bubbleLeft = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const stretch = useRef(new Animated.Value(0)).current;
  const lean = useRef(new Animated.Value(0)).current;
  const iconScales = useMemo(() => tabs.map(() => new Animated.Value(1)), [tabs.length]);
  const scaleX = useMemo(() => Animated.add(press, stretch), [press, stretch]);
  const scaleY = useMemo(
    () => Animated.subtract(press, Animated.multiply(stretch, 0.6)),
    [press, stretch],
  );

  // The pan responder is created once, so it reads everything it needs from here.
  const live = useRef({ geometry, tabs, activeIndex, reduceMotion, onTabPress });
  live.current = { geometry, tabs, activeIndex, reduceMotion, onTabPress };
  const hover = useRef<number | null>(null);
  const placed = useRef(false);

  const springTo = useCallback(
    (value: Animated.Value, toValue: number) => {
      if (live.current.reduceMotion) {
        value.setValue(toValue);
        return;
      }
      Animated.spring(value, {
        toValue,
        damping: 13,
        stiffness: 210,
        mass: 0.9,
        useNativeDriver: true,
      }).start();
    },
    [],
  );

  const settleOn = useCallback(
    (index: number) => {
      bubbleLeft.stopAnimation();
      springTo(bubbleLeft, tabLeft(index, live.current.geometry));
      springTo(press, 1);
      springTo(stretch, 0);
      springTo(lean, 0);
    },
    [bubbleLeft, press, stretch, lean, springTo],
  );

  // Keep the bubble on the active tab when it changes from outside (or the bar is first measured).
  useEffect(() => {
    if (bubbleWidth <= 0 || hover.current !== null) return;
    const target = tabLeft(activeIndex, geometry);
    if (!placed.current) {
      bubbleLeft.setValue(target);
      placed.current = true;
    } else {
      bubbleLeft.stopAnimation();
      springTo(bubbleLeft, target);
    }
  }, [activeIndex, geometry, bubbleWidth, bubbleLeft, springTo]);

  const xInTrack = (pageX: number) => pageX - trackPageX.current - PAD;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: (_event, gesture) => {
          const { geometry: g, activeIndex: current, reduceMotion: calm } = live.current;
          const index = tabIndexAt(xInTrack(gesture.x0), g);
          hover.current = index;
          setHoverIndex(index);
          if (index !== current) haptics.select();
          bubbleLeft.stopAnimation();
          springTo(bubbleLeft, tabLeft(index, g));
          if (!calm) springTo(press, PRESS_SCALE);
        },

        onPanResponderMove: (_event, gesture) => {
          const { geometry: g, reduceMotion: calm } = live.current;
          const x = xInTrack(gesture.moveX);
          const index = tabIndexAt(x, g);
          if (index !== hover.current) {
            hover.current = index;
            setHoverIndex(index);
            haptics.select();
          }
          bubbleLeft.stopAnimation();
          if (calm) {
            bubbleLeft.setValue(tabLeft(index, g));
          } else {
            bubbleLeft.setValue(bubbleLeftForFinger(x, g));
            stretch.setValue(stretchForVelocity(gesture.vx));
            lean.setValue(Math.max(-MAX_LEAN, Math.min(MAX_LEAN, -gesture.vx * 7)));
          }
        },

        onPanResponderRelease: () => {
          const { tabs: items, activeIndex: current, onTabPress: select } = live.current;
          const index = hover.current ?? current;
          hover.current = null;
          setHoverIndex(null);
          settleOn(index);
          if (index !== current) select(items[index].id);
        },

        onPanResponderTerminate: () => {
          hover.current = null;
          setHoverIndex(null);
          settleOn(live.current.activeIndex);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bubbleLeft, press, stretch, lean, springTo, settleOn],
  );

  const measureTrack = useCallback(() => {
    trackRef.current?.measureInWindow?.((x) => {
      trackPageX.current = x;
    });
  }, []);

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
    measureTrack();
  };

  const activate = (index: number) => {
    if (index === activeIndex) return;
    haptics.select();
    onTabPress(tabs[index].id);
  };

  const lit = hoverIndex ?? activeIndex;

  // The lit icon swells slightly, as though magnified by the lens passing over it.
  useEffect(() => {
    iconScales.forEach((scale, index) => springTo(scale, index === lit ? LIT_ICON_SCALE : 1));
  }, [lit, iconScales, springTo]);

  return (
    <View
      style={[
        styles.floatingContainer,
        // Sit above the home indicator rather than under it.
        { bottom: layout.tabBarInset + insets.bottom },
      ]}
    >
      <GlassSurface borderRadius={radius.pill} style={styles.glass}>
        <View
          ref={trackRef}
          style={styles.track}
          onLayout={handleLayout}
          accessibilityRole="tablist"
          {...pan.panHandlers}
        >
          {/* The bubble sits beneath the icons so they stay crisp. */}
          <Animated.View
            style={[
              styles.bubble,
              {
                width: bubbleWidth,
                opacity: bubbleWidth > 0 ? 1 : 0,
                transform: [{ translateX: bubbleLeft }, { scaleX }, { scaleY }],
              },
            ]}
          >
            <TabBubble lean={reduceMotion ? undefined : lean} />
          </Animated.View>

          {tabs.map((tab, index) => {
            const isLit = index === lit;
            return (
              <View
                key={tab.id}
                style={styles.tab}
                accessible
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: index === activeIndex }}
                accessibilityActions={[{ name: 'activate' }]}
                onAccessibilityAction={(event) => {
                  if (event.nativeEvent.actionName === 'activate') activate(index);
                }}
                onAccessibilityTap={() => activate(index)}
              >
                <Animated.View style={{ transform: [{ scale: iconScales[index] }] }}>
                  <Icon
                    name={tab.icon as FeatherIconName}
                    size={19}
                    color={isLit ? colors.brand : colors.textSecondary}
                  />
                </Animated.View>
                <Text style={[styles.tabLabel, isLit && styles.tabLabelLit]} numberOfLines={1}>
                  {tab.label}
                </Text>
              </View>
            );
          })}
        </View>
      </GlassSurface>
    </View>
  );
};

const styles = themedStyles(() =>
  StyleSheet.create({
    floatingContainer: {
      position: 'absolute',
      left: spacing.xl,
      right: spacing.xl,
      alignItems: 'center',
      zIndex: 99,
      pointerEvents: 'box-none',
    },
    glass: {
      width: '100%',
      maxWidth: 380,
      minHeight: layout.tabBarHeight,
    },
    track: {
      flexDirection: 'row',
      alignItems: 'stretch',
      height: layout.tabBarHeight,
      paddingHorizontal: PAD,
      paddingVertical: PAD,
    },
    bubble: {
      position: 'absolute',
      top: PAD,
      left: PAD,
      height: TAB_HEIGHT,
    },
    tab: {
      flex: 1,
      height: TAB_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: spacing.xs,
    },
    tabLabel: {
      ...typography.caption,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    tabLabelLit: {
      color: colors.brand,
    },
  }),
);
