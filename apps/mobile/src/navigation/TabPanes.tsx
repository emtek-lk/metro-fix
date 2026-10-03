import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

interface TabPaneProps {
  active: boolean;
  children: React.ReactNode;
}

/**
 * Re-renders only while it is the visible pane. A hidden pane keeps its mounted tree (and scroll
 * position) but ignores parent updates until it is shown again, so background tabs cost nothing.
 */
const TabPane = React.memo(
  ({ active, children }: TabPaneProps) => (
    <View
      style={active ? styles.active : styles.hidden}
      // Hidden panes must not be reachable by screen readers or touches.
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
      pointerEvents={active ? 'auto' : 'none'}
    >
      {children}
    </View>
  ),
  (previous, next) => !previous.active && !next.active,
);

export interface TabPanesProps {
  activeTab: string;
  /** One render function per tab id. A tab's screen is created the first time it is opened. */
  panes: Record<string, () => React.ReactNode>;
}

/**
 * Keeps each visited tab mounted and just toggles which one is visible. Switching tabs then costs
 * a style change instead of tearing down one screen and building the next, which is what made tab
 * taps feel laggy (especially on Android).
 */
export const TabPanes: React.FC<TabPanesProps> = ({ activeTab, panes }) => {
  const visited = useRef(new Set<string>());
  visited.current.add(activeTab);

  return (
    <View style={styles.fill}>
      {Object.keys(panes).map((id) =>
        visited.current.has(id) ? (
          <TabPane key={id} active={id === activeTab}>
            {panes[id]()}
          </TabPane>
        ) : null,
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  active: {
    flex: 1,
  },
  // display:none removes the pane from layout and drawing entirely.
  hidden: {
    display: 'none',
  },
});
