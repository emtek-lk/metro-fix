import React from 'react';
import { Text, TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { JobStatus, ServiceRequest } from '@metro-fix/core-types';
import { RegisterScreen } from '../src/components/RegisterScreen';
import { MyRequestsScreen } from '../src/components/MyRequestsScreen';
import { ToastProvider } from '../src/components/ui/Toast';
import { ThemeProvider } from '../src/theme/ThemeProvider';

jest.mock('../src/hooks/useJobs', () => ({
  useJobDetail: () => ({ data: undefined }),
}));

const mounted: ReactTestRenderer.ReactTestRenderer[] = [];

// Unmount after each test so toast timers don't fire once the environment is torn down.
afterEach(async () => {
  await ReactTestRenderer.act(async () => {
    mounted.splice(0).forEach((renderer) => renderer.unmount());
  });
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

// All visible text, joined. (Serialising the tree breaks on animated props.)
const text = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root
    .findAllByType(Text)
    .map((node) =>
      React.Children.toArray(node.props.children)
        .filter((child) => typeof child === 'string' || typeof child === 'number')
        .join(''),
    )
    .join(' | ');

const pressByLabel = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const target = renderer.root.find(
    (node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function',
  );
  await ReactTestRenderer.act(async () => {
    target.props.onPress();
  });
};

const typeInto = async (renderer: ReactTestRenderer.ReactTestRenderer, placeholder: string, value: string) => {
  const input = renderer.root.findAllByType(TextInput).find((node) => node.props.placeholder === placeholder);
  if (!input) throw new Error(`No input with placeholder "${placeholder}"`);
  await ReactTestRenderer.act(async () => {
    input.props.onChangeText(value);
  });
};

describe('RegisterScreen', () => {
  it('shows field errors and does not submit an empty form', async () => {
    const onSubmit = jest.fn();
    const renderer = await mount(<RegisterScreen onBack={jest.fn()} onSubmit={onSubmit} />);

    await pressByLabel(renderer, 'Create account');

    const out = text(renderer);
    expect(out).toContain('Enter your full name.');
    expect(out).toContain('Enter a valid email address.');
    expect(out).toContain('Use at least 8 characters.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits once the form is valid', async () => {
    const onSubmit = jest.fn(async () => undefined);
    const renderer = await mount(<RegisterScreen onBack={jest.fn()} onSubmit={onSubmit} />);

    await typeInto(renderer, 'Eleanor Vance', 'Eleanor Vance');
    await typeInto(renderer, 'you@company.com', 'eleanor@skylinetowers.com');
    await typeInto(renderer, '+94 77 123 4567', '+94 77 123 4567');
    await typeInto(renderer, 'At least 8 characters', 'Skyline2026');
    await typeInto(renderer, 'Re-enter your password', 'Skyline2026');
    await pressByLabel(renderer, 'Create account');

    expect(onSubmit).toHaveBeenCalledWith({
      fullName: 'Eleanor Vance',
      email: 'eleanor@skylinetowers.com',
      phone: '+94 77 123 4567',
      address: '',
      password: 'Skyline2026',
      confirmPassword: 'Skyline2026',
    });
  });

  it('tells the customer sign-up is not available when it is not connected', async () => {
    const renderer = await mount(<RegisterScreen onBack={jest.fn()} />);
    await typeInto(renderer, 'Eleanor Vance', 'Eleanor Vance');
    await typeInto(renderer, 'you@company.com', 'eleanor@skylinetowers.com');
    await typeInto(renderer, '+94 77 123 4567', '+94 77 123 4567');
    await typeInto(renderer, 'At least 8 characters', 'Skyline2026');
    await typeInto(renderer, 'Re-enter your password', 'Skyline2026');
    await pressByLabel(renderer, 'Create account');

    expect(text(renderer)).toContain('Coming soon');
  });

  it('goes back to sign in', async () => {
    const onBack = jest.fn();
    const renderer = await mount(<RegisterScreen onBack={onBack} />);
    await pressByLabel(renderer, 'Back to sign in');
    expect(onBack).toHaveBeenCalled();
  });
});

describe('MyRequestsScreen', () => {
  it('invites the customer to book when there are no requests', async () => {
    const onBook = jest.fn();
    const renderer = await mount(<MyRequestsScreen requests={[]} onOpen={jest.fn()} onBook={onBook} />);

    expect(text(renderer)).toContain('No requests yet');
    await pressByLabel(renderer, 'Book a service');
    expect(onBook).toHaveBeenCalled();
  });

  it('lists requests and opens one', async () => {
    const request = {
      id: 'A196433E-F36B-1410-8C67-00B2BC2CF9FE',
      title: 'Lobby AC not cooling',
      description: 'Warm air',
      status: JobStatus.REQUESTED,
      servicePillar: 'HARD',
      facilityType: 'COMMERCIAL',
      createdAt: new Date().toISOString(),
    } as unknown as ServiceRequest;
    const onOpen = jest.fn();
    const renderer = await mount(<MyRequestsScreen requests={[request]} onOpen={onOpen} onBook={jest.fn()} />);

    expect(text(renderer)).toContain('Lobby AC not cooling');
    await pressByLabel(renderer, 'Open request Lobby AC not cooling');
    expect(onOpen).toHaveBeenCalledWith(request);
  });
});
