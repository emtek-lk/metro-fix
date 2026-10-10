import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import type { JobCard } from '@metro-fix/core-types';
import { QuoteBreakdown } from '../src/components/QuoteBreakdown';
import { ChangePasswordScreen } from '../src/components/ChangePasswordScreen';
import { ToastProvider } from '../src/components/ui/Toast';
import { ThemeProvider } from '../src/theme/ThemeProvider';

const mockPost = jest.fn();
const mockCompletePasswordChange = jest.fn(async () => undefined);
const mockLogout = jest.fn(async () => undefined);

jest.mock('../src/lib/api', () => ({ apiClient: { post: (...args: unknown[]) => mockPost(...args) } }));
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ logout: mockLogout, completePasswordChange: mockCompletePasswordChange }),
}));

const mounted: ReactTestRenderer.ReactTestRenderer[] = [];
afterEach(async () => {
  await ReactTestRenderer.act(async () => {
    mounted.splice(0).forEach((renderer) => renderer.unmount());
  });
  jest.clearAllMocks();
});

const mount = async (element: React.ReactElement) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <ToastProvider>{element}</ToastProvider>
      </ThemeProvider>,
    );
  });
  mounted.push(renderer);
  return renderer;
};

const text = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root
    .findAllByType(Text)
    .map((node) =>
      React.Children.toArray(node.props.children)
        .filter((child) => typeof child === 'string' || typeof child === 'number')
        .join(''),
    )
    .join(' | ');

const section = (total: number, over: Partial<JobCard['estimate']> = {}): JobCard['estimate'] => ({
  lineItems: [
    { id: 'l1', kind: 'LABOUR', description: 'Mechanical technician', quantity: 5, unitPrice: 3500 },
    { id: 'l2', kind: 'MATERIAL', description: '3 HP centrifugal pump', quantity: 1, unitPrice: 84500 },
  ],
  hours: 5,
  notes: 'Like-for-like pump',
  subtotal: 102000,
  tax: 0,
  total,
  savedAt: '2026-10-04T00:00:00Z',
  ...over,
});

describe('QuoteBreakdown', () => {
  it('lists every line with quantity, rate and amount, plus total, hours and the technician note', async () => {
    const renderer = await mount(<QuoteBreakdown card={{ currency: 'LKR', taxRate: 0, estimate: section(102000) }} />);
    const shown = text(renderer);
    expect(shown).toContain('Quote from your technician');
    expect(shown).toContain('Mechanical technician');
    expect(shown).toContain('Labour · 5 h × LKR 3,500.00');
    expect(shown).toContain('LKR 17,500.00');
    expect(shown).toContain('3 HP centrifugal pump');
    expect(shown).toContain('LKR 102,000.00');
    expect(shown).toContain('Estimated time: about 5 hours');
    expect(shown).toContain('Like-for-like pump');
    expect(shown).not.toContain('Tax');
  });

  it('shows tax when there is any, and a final bill that differs from the quote', async () => {
    const card: JobCard = {
      currency: 'LKR',
      taxRate: 18,
      estimate: section(120360, { tax: 18360 }),
      final: section(130000, { tax: 19831.35, notes: '' }),
    };
    const shown = text(await mount(<QuoteBreakdown card={card} />));
    expect(shown).toContain('Final bill');
    expect(shown).toContain('Tax (18%)');
    expect(shown).toContain('Originally quoted LKR 120,360.00');
    expect(shown).toContain('Time spent: about 5 hours');
  });

  it('renders nothing when there are no lines', async () => {
    const renderer = await mount(<QuoteBreakdown card={{ currency: 'LKR', taxRate: 0, estimate: section(0, { lineItems: [] }) }} />);
    expect(text(renderer)).toBe('');
  });
});

describe('ChangePasswordScreen', () => {
  const fill = async (renderer: ReactTestRenderer.ReactTestRenderer, values: [string, string, string]) => {
    const inputs = renderer.root.findAllByType(require('react-native').TextInput);
    await ReactTestRenderer.act(async () => {
      inputs.forEach((input, index) => input.props.onChangeText(values[index]));
    });
  };
  const submit = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
    const button = renderer.root.find((node) => node.props.accessibilityLabel === 'Save new password' && typeof node.props.onPress === 'function');
    await ReactTestRenderer.act(async () => {
      await button.props.onPress();
    });
  };

  it('forced mode explains the one-time password and offers sign out, not back', async () => {
    const renderer = await mount(<ChangePasswordScreen forced />);
    const shown = text(renderer);
    expect(shown).toContain('Choose your password');
    expect(shown).toContain('one-time password');
    expect(shown).toContain('Sign out');
  });

  it('rejects mismatched or unchanged passwords without calling the API', async () => {
    const renderer = await mount(<ChangePasswordScreen forced />);
    await fill(renderer, ['Temp12345x', 'NewPass2026', 'Different2026']);
    await submit(renderer);
    expect(text(renderer)).toContain('do not match');
    await fill(renderer, ['Temp12345x', 'Temp12345x', 'Temp12345x']);
    await submit(renderer);
    expect(text(renderer)).toContain('different from the current one');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('changes the password, lifts the gate and reports done', async () => {
    mockPost.mockResolvedValueOnce({ data: {} });
    const onDone = jest.fn();
    const renderer = await mount(<ChangePasswordScreen forced onDone={onDone} />);
    await fill(renderer, ['Temp12345x', 'NewPass2026', 'NewPass2026']);
    await submit(renderer);
    expect(mockPost).toHaveBeenCalledWith('/auth/change-password', { currentPassword: 'Temp12345x', newPassword: 'NewPass2026' });
    expect(mockCompletePasswordChange).toHaveBeenCalled();
    expect(onDone).toHaveBeenCalled();
  });

  it('shows the API reason when it refuses the new password', async () => {
    mockPost.mockRejectedValueOnce({ response: { data: { message: 'Use at least 8 characters.' } } });
    const renderer = await mount(<ChangePasswordScreen forced />);
    await fill(renderer, ['Temp12345x', 'short1', 'short1']);
    await submit(renderer);
    expect(text(renderer)).toContain('Use at least 8 characters.');
    expect(mockCompletePasswordChange).not.toHaveBeenCalled();
  });
});
