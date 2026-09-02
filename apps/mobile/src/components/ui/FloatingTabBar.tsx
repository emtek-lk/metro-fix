import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/layout';
import { elevation } from '../../theme/elevation';
import { Icon, type FeatherIconName } from './Icon';

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

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  activeTab,
  onTabPress,
  tabs = DEFAULT_TABS,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.floatingContainer,
        // Sit above the home indicator rather than under it.
        { bottom: layout.tabBarInset + insets.bottom },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.tabPill}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={({ pressed }) => [
                styles.tabButton,
                isActive && styles.activeTabButton,
                pressed && !isActive && styles.pressedTabButton,
              ]}
              onPress={() => onTabPress(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <Icon
                name={tab.icon as FeatherIconName}
                size={19}
                color={isActive ? colors.textInverse : colors.textSecondary}
              />
              <Text
                style={[styles.tabLabel, isActive && styles.activeTabLabel]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
    zIndex: 99,
  },
  tabPill: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 380,
    minHeight: layout.tabBarHeight,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.e3,
  },
  tabButton: {
    flex: 1,
    minHeight: layout.minTap + 4,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  pressedTabButton: {
    backgroundColor: colors.surfaceRaised,
  },
  activeTabButton: {
    backgroundColor: colors.white,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeTabLabel: {
    color: colors.textInverse,
  },
});
