import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from './AppText';
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
  /** Unread counts by tab id; a tab with a count above zero shows a badge. */
  badges?: Record<string, number>;
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
/** The finger has to travel this far (px) before the bubble stops snapping to tabs and follows it. */
const FOLLOW_AFTER = 4;

/**
 * Springs, in Apple's response / damping-ratio terms. A drag carries momentum, so the bubble is
 * allowed a little overshoot when it lands; the icon and swell stay calm.
 */
const SETTLE_SPRING = { duration: 400, dampingRatio: 0.8 } as const;
const SWELL_SPRING = { duration: 300, dampingRatio: 0.8 } as const;
const ICON_SPRING = { duration: 300, dampingRatio: 0.8 } as const;

interface TabButtonProps {
  tab: TabItem;
  index: number;
  isActive: boolean;
  badge?: number;
  /** Index of the lit tab, on the UI thread. */
  litIndex: SharedValue<number>;
  calm: SharedValue<boolean>;
  onActivate: (index: number) => void;
}

interface TabFaceProps {
  tab: TabItem;
  color: string;
  labelStyle?: object;
  badge?: number;
  iconStyle: object;
}

/** One tab's icon and label. Drawn twice (resting colours, lit colours) and cross-faded. */
const TabFace: React.FC<TabFaceProps> = ({ tab, color, labelStyle, badge, iconStyle }) => (
  <View style={styles.face}>
    <Animated.View style={[styles.iconWrap, iconStyle]}>
      <Icon name={tab.icon as FeatherIconName} size={19} color={color} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText} maxFontSizeMultiplier={1}>
            {badge > 9 ? '9+' : badge}
          </Text>
        </View>
      ) : null}
    </Animated.View>
    <Text style={[styles.tabLabel, labelStyle]} numberOfLines={1} maxFontSizeMultiplier={1.15}>
      {tab.label}
    </Text>
  </View>
);

const TabButton: React.FC<TabButtonProps> = ({
  tab,
  index,
  isActive,
  badge,
  litIndex,
  calm,
  onActivate,
}) => {
  // The lit icon swells slightly, as though magnified by the lens passing over it.
  const iconStyle = useAnimatedStyle(() => {
    const target = litIndex.get() === index ? LIT_ICON_SCALE : 1;
    return { transform: [{ scale: calm.get() ? target : withSpring(target, ICON_SPRING) }] };
  });
  // The lit colours fade in over the resting ones, all on the UI thread, so the tab under the
  // finger lights up with the bubble even while the JS thread is busy.
  const litStyle = useAnimatedStyle(() => {
    const target = litIndex.get() === index ? 1 : 0;
    return { opacity: calm.get() ? target : withTiming(target, { duration: 120 }) };
  });

  return (
    <View
      style={styles.tab}
      accessible
      accessibilityRole="tab"
      accessibilityLabel={badge ? `${tab.label}, ${badge} unread` : tab.label}
      accessibilityState={{ selected: isActive }}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'activate') onActivate(index);
      }}
      onAccessibilityTap={() => onActivate(index)}
    >
      <TabFace tab={tab} color={colors.textSecondary} badge={badge} iconStyle={iconStyle} />
      <Animated.View style={[styles.litLayer, litStyle]}>
        <TabFace tab={tab} color={colors.brand} labelStyle={styles.tabLabelLit} iconStyle={iconStyle} />
      </Animated.View>
    </View>
  );
};

/**
 * Floating glass tab bar with a sliding "bubble" under the active tab.
 *
 * Touch anywhere on the bar and the bubble swells and springs to that tab; drag and it follows the
 * finger (stretching slightly with speed), lighting each tab as it passes; lift and it settles on
 * the nearest tab, carrying the finger's release velocity, and selects it. Screen readers get a
 * plain tab list and activate tabs directly.
 *
 * Every frame of the drag runs on the UI thread (Gesture Handler + Reanimated shared values), so
 * it stays smooth while the JS thread is busy. React state changes only when the finger moves onto
 * a different tab, to recolour that tab's icon and label.
 */
export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  activeTab,
  onTabPress,
  tabs = DEFAULT_TABS,
  badges,
}) => {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const count = tabs.length;
  const activeIndex = Math.max(
    tabs.findIndex((tab) => tab.id === activeTab),
    0,
  );

  const [trackWidth, setTrackWidth] = useState(0);

  const innerWidth = Math.max(trackWidth - PAD * 2, 0);
  const geometry = useMemo(() => ({ innerWidth, count }), [innerWidth, count]);
  const bubbleWidth = tabWidth(geometry);

  // UI-thread state. `hover` is -1 while no finger is down.
  const bubbleLeft = useSharedValue(0);
  const press = useSharedValue(1);
  const stretch = useSharedValue(0);
  const lean = useSharedValue(0);
  const hover = useSharedValue(-1);
  const following = useSharedValue(false);
  const activated = useSharedValue(false);
  const inner = useSharedValue(0);
  const active = useSharedValue(activeIndex);
  const calm = useSharedValue(reduceMotion);
  const litIndex = useDerivedValue(() => (hover.get() >= 0 ? hover.get() : active.get()));

  const live = useRef({ tabs, onTabPress });
  live.current = { tabs, onTabPress };
  const placed = useRef(false);

  useEffect(() => {
    calm.set(reduceMotion);
  }, [calm, reduceMotion]);
  useEffect(() => {
    active.set(activeIndex);
  }, [active, activeIndex]);

  // Keep the bubble on the active tab when it changes from outside (or the bar is first measured).
  useEffect(() => {
    if (bubbleWidth <= 0 || hover.get() >= 0) return;
    const target = tabLeft(activeIndex, geometry);
    if (!placed.current) {
      bubbleLeft.set(target);
      placed.current = true;
    } else {
      bubbleLeft.set(reduceMotion ? target : withSpring(target, SETTLE_SPRING));
    }
  }, [activeIndex, geometry, bubbleWidth, bubbleLeft, hover, reduceMotion]);

  const selectTab = useCallback((index: number) => {
    const { tabs: items, onTabPress: select } = live.current;
    select(items[index].id);
  }, []);

  // Haptic tick when the finger crosses onto another tab. No React state changes during a drag.
  useAnimatedReaction(
    () => hover.get(),
    (current, previous) => {
      if (current === previous) return;
      const grabbed = previous == null || previous < 0;
      if (current >= 0 && (grabbed ? current !== active.get() : true)) {
        scheduleOnRN(haptics.select);
      }
    },
  );

  const pan = useMemo(() => {
    const geo = () => {
      'worklet';
      return { innerWidth: inner.get(), count };
    };
    const settle = (index: number, velocity: number) => {
      'worklet';
      const target = tabLeft(index, geo());
      if (calm.get()) {
        bubbleLeft.set(target);
        press.set(1);
        stretch.set(0);
        lean.set(0);
        return;
      }
      bubbleLeft.set(withSpring(target, { ...SETTLE_SPRING, velocity }));
      press.set(withSpring(1, SWELL_SPRING));
      stretch.set(withSpring(0, SWELL_SPRING));
      lean.set(withSpring(0, SWELL_SPRING));
    };

    return Gesture.Pan()
      .minDistance(0)
      .onBegin((event) => {
        const index = tabIndexAt(event.x - PAD, geo());
        following.set(false);
        activated.set(false);
        hover.set(index);
        bubbleLeft.set(
          calm.get() ? tabLeft(index, geo()) : withSpring(tabLeft(index, geo()), SETTLE_SPRING),
        );
        if (!calm.get()) press.set(withSpring(PRESS_SCALE, SWELL_SPRING));
      })
      .onStart(() => {
        activated.set(true);
      })
      .onUpdate((event) => {
        const x = event.x - PAD;
        hover.set(tabIndexAt(x, geo()));
        if (calm.get()) {
          bubbleLeft.set(tabLeft(hover.get(), geo()));
          return;
        }
        // A small hysteresis, so a tap that wobbles a pixel does not drag the bubble off its tab.
        if (!following.get() && Math.abs(event.translationX) < FOLLOW_AFTER) return;
        following.set(true);
        const vx = event.velocityX / 1000; // px per ms
        bubbleLeft.set(bubbleLeftForFinger(x, geo()));
        stretch.set(stretchForVelocity(vx));
        lean.set(Math.max(-MAX_LEAN, Math.min(MAX_LEAN, -vx * 7)));
      })
      .onFinalize((event, success) => {
        const picked = hover.get() >= 0 ? hover.get() : active.get();
        // A quick tap ends before the pan ever activates (no move event), which reports as
        // unsuccessful. Treat that as a tap on the tab under the finger; only a pan that did
        // activate and then failed was genuinely cancelled (e.g. the system took the touch).
        const released = success || !activated.get();
        hover.set(-1);
        following.set(false);
        activated.set(false);
        settle(released ? picked : active.get(), released && success ? (event.velocityX ?? 0) : 0);
        if (released && picked !== active.get()) scheduleOnRN(selectTab, picked);
      });
  }, [count, bubbleLeft, press, stretch, lean, hover, following, activated, inner, active, calm, selectTab]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setTrackWidth(width);
    inner.set(Math.max(width - PAD * 2, 0));
  };

  const activate = (index: number) => {
    if (index === activeIndex) return;
    haptics.select();
    onTabPress(tabs[index].id);
  };

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: bubbleLeft.get() },
      { scaleX: press.get() + stretch.get() },
      { scaleY: press.get() - stretch.get() * 0.6 },
    ],
  }));

  return (
    <View
      style={[
        styles.floatingContainer,
        // Sit above the home indicator rather than under it.
        { bottom: layout.tabBarInset + insets.bottom },
      ]}
    >
      <GlassSurface borderRadius={radius.pill} style={styles.glass} shadow={Platform.OS !== 'android'}>
        <GestureDetector gesture={pan}>
          <View style={styles.track} onLayout={handleLayout} accessibilityRole="tablist">
            {/* The bubble sits beneath the icons so they stay crisp. */}
            <Animated.View
              style={[
                styles.bubble,
                { width: bubbleWidth, opacity: bubbleWidth > 0 ? 1 : 0 },
                bubbleStyle,
              ]}
            >
              <TabBubble lean={reduceMotion ? undefined : lean} />
            </Animated.View>

            {tabs.map((tab, index) => (
              <TabButton
                key={tab.id}
                tab={tab}
                index={index}
                isActive={index === activeIndex}
                badge={badges?.[tab.id]}
                litIndex={litIndex}
                calm={calm}
                onActivate={activate}
              />
            ))}
          </View>
        </GestureDetector>
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
    face: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    litLayer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
    },
    iconWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      top: -5,
      right: -9,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 4,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.brand,
      borderWidth: 1.5,
      borderColor: colors.glassSolid,
    },
    badgeText: {
      fontSize: 9,
      lineHeight: 11,
      fontWeight: '800',
      color: colors.white,
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
