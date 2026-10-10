import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { PressableScale } from '../src/components/ui/PressableScale';

const flatten = (style: unknown): Record<string, unknown> =>
  (Array.isArray(style) ? style : [style]).flat(Infinity).reduce<Record<string, unknown>>(
    (acc, entry) => (entry && typeof entry === 'object' ? { ...acc, ...(entry as object) } : acc),
    {},
  );

describe('PressableScale', () => {
  it('applies a function style (the animated wrapper cannot take one itself)', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <PressableScale style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.5 : 1 })}>
          <Text>Tap</Text>
        </PressableScale>,
      );
    });
    const view = renderer.root.findByProps({ accessible: true });
    expect(flatten(view.props.style)).toMatchObject({ flex: 1, opacity: 1 });

    await ReactTestRenderer.act(async () => {
      view.props.onResponderGrant?.({ nativeEvent: {}, persist: () => undefined });
    });
  });

  it('passes a plain style object through', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <PressableScale style={{ minHeight: 44 }}>
          <Text>Tap</Text>
        </PressableScale>,
      );
    });
    const view = renderer.root.findByProps({ accessible: true });
    expect(flatten(view.props.style)).toMatchObject({ minHeight: 44 });
  });
});
