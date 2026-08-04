import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';

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
  { id: 'jobs', label: 'Roster', icon: '🏠' },
  { id: 'history', label: 'History', icon: '📋' },
  { id: 'alerts', label: 'Alerts', icon: '🔔' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  activeTab,
  onTabPress,
  tabs = DEFAULT_TABS,
}) => {
  return (
    <View style={styles.floatingContainer}>
      <View style={styles.tabPill}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabIcon, isActive && styles.activeTabIcon]}>
                {tab.icon}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 99,
  },
  tabPill: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 999, // Extreme pill shape
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  tabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF', // Clean white active bubble matching reference
    transform: [{ scale: 1.05 }],
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  activeTabIcon: {
    opacity: 1,
  },
});
