import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Role } from '@metro-fix/core-types';
import { AuthProvider, useAuth, type AuthContextType } from '../src/context/AuthContext';

const mockStore: Record<string, string> = {};
jest.mock('../src/lib/storage', () => ({
  TOKEN_KEY: 'token',
  USER_KEY: 'user',
  storage: {
    getItemAsync: jest.fn(async (key: string) => mockStore[key] ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      mockStore[key] = value;
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete mockStore[key];
    }),
  },
}));

const mockRegister = jest.fn();
jest.mock('../src/services/api', () => ({ apiService: { register: (...args: unknown[]) => mockRegister(...args) } }));

let mockHandler: (() => void) | null = null;
jest.mock('../src/lib/api', () => ({
  apiClient: { get: jest.fn(async () => ({ data: null })), post: jest.fn() },
  setUnauthorizedHandler: (handler: (() => void) | null) => {
    mockHandler = handler;
  },
}));

let auth!: AuthContextType;
const Probe = () => {
  auth = useAuth();
  return null;
};

const mount = async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
  });
  // Restoring a saved session takes several awaited steps; let them all finish.
  for (let i = 0; i < 5; i += 1) {
    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });
  }
  return renderer;
};

const customer = { id: 'u1', fullName: 'Eleanor Vance', email: 'eleanor@skylinetowers.com', role: Role.CUSTOMER };

beforeEach(() => {
  Object.keys(mockStore).forEach((key) => delete mockStore[key]);
  mockRegister.mockReset();
  mockHandler = null;
});

describe('registration', () => {
  it('creates the account and signs the new customer in', async () => {
    mockRegister.mockResolvedValue({ accessToken: 'new-token', user: customer });
    const renderer = await mount();

    await ReactTestRenderer.act(async () => {
      await auth.register({ fullName: 'Eleanor Vance', email: 'eleanor@skylinetowers.com', phone: '+94 77 123 4567', password: 'Skyline2026' });
    });

    expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({ email: 'eleanor@skylinetowers.com' }));
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.user).toMatchObject({ role: Role.CUSTOMER });
    expect(mockStore.token).toBe('new-token');
    await ReactTestRenderer.act(async () => renderer.unmount());
  });

  it('stays signed out when the server refuses', async () => {
    mockRegister.mockRejectedValue({ response: { status: 409, data: { message: 'An account with this email already exists.' } } });
    const renderer = await mount();

    // Catch inside act(): letting act() itself reject leaves React's test scheduler in a bad state
    // and breaks the tests that follow.
    let failure: unknown;
    await ReactTestRenderer.act(async () => {
      try {
        await auth.register({ fullName: 'x y', email: 'a@b.co', phone: '1234567', password: 'Passw0rd1' });
      } catch (error) {
        failure = error;
      }
    });
    expect(failure).toBeDefined();

    expect(auth.isAuthenticated).toBe(false);
    expect(mockStore.token).toBeUndefined();
    await ReactTestRenderer.act(async () => renderer.unmount());
  });
});

describe('expired sessions', () => {
  it('signs the user out when the API says the token is no longer valid', async () => {
    mockStore.token = 'old-token';
    mockStore.user = JSON.stringify(customer);
    const renderer = await mount();
    expect(auth.isAuthenticated).toBe(true);
    expect(mockHandler).toBeInstanceOf(Function);

    await ReactTestRenderer.act(async () => {
      mockHandler?.();
    });

    expect(auth.isAuthenticated).toBe(false);
    expect(mockStore.token).toBeUndefined();
    await ReactTestRenderer.act(async () => renderer.unmount());
  });

  it('stops listening when the provider goes away', async () => {
    const renderer = await mount();
    expect(mockHandler).not.toBeNull();
    await ReactTestRenderer.act(async () => renderer.unmount());
    expect(mockHandler).toBeNull();
  });
});
