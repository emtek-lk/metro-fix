import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FloatingTabBar } from '../src/components/ui/FloatingTabBar';
import { ThemeProvider } from '../src/theme/ThemeProvider';

const TABS = [
  { id: 'jobs', label: 'Roster', icon: 'home' },
  { id: 'history', label: 'History', icon: 'clipboard' },
  { id: 'alerts', label: 'Alerts', icon: 'bell' },
];

const insets = { top: 0, left: 0, right: 0, bottom: 0 };
const frame = { x: 0, y: 0, width: 390, height: 844 };

async function render(props: Partial<React.ComponentProps<typeof FloatingTabBar>> = {}) {
  const onTabPress = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={{ insets, frame }}>
        <ThemeProvider>
          <FloatingTabBar activeTab="jobs" onTabPress={onTabPress} tabs={TABS} {...props} />
        </ThemeProvider>
      </SafeAreaProvider>,
    );
  });
  return { renderer, onTabPress };
}

const tabsOf = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(
    (node) => typeof node.type === 'string' && node.props.accessibilityRole === 'tab',
  );

describe('FloatingTabBar', () => {
  it('renders every tab and marks the active one selected', async () => {
    const { renderer } = await render();
    const tabs = tabsOf(renderer);
    expect(tabs.map((tab) => tab.props.accessibilityLabel)).toEqual(['Roster', 'History', 'Alerts']);
    expect(tabs.map((tab) => tab.props.accessibilityState.selected)).toEqual([true, false, false]);
  });

  it('lets a screen reader activate another tab', async () => {
    const { renderer, onTabPress } = await render();
    await ReactTestRenderer.act(async () => {
      tabsOf(renderer)[2].props.onAccessibilityAction({ nativeEvent: { actionName: 'activate' } });
    });
    expect(onTabPress).toHaveBeenCalledWith('alerts');
  });

  it('does not re-select the tab that is already active', async () => {
    const { renderer, onTabPress } = await render();
    await ReactTestRenderer.act(async () => {
      tabsOf(renderer)[0].props.onAccessibilityTap();
    });
    expect(onTabPress).not.toHaveBeenCalled();
  });

  it('announces unread counts on a badged tab', async () => {
    const { renderer } = await render({ badges: { alerts: 3 } });
    expect(tabsOf(renderer)[2].props.accessibilityLabel).toBe('Alerts, 3 unread');
  });
});
