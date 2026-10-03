import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Role } from '@metro-fix/core-types';

let mockUser: { id: string; fullName: string; role: string } | null = null;

jest.mock('../src/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    isAuthenticated: mockUser !== null,
    logout: jest.fn(),
  }),
}));

// Replace the screens with markers; this test is only about which app each role gets.
jest.mock('../src/components/WorkerDashboard', () => ({ WorkerDashboard: () => 'WORKER_ROSTER' }));
jest.mock('../src/components/CustomerBookingWizard', () => ({
  CustomerBookingWizard: () => 'CUSTOMER_BOOKING',
}));
jest.mock('../src/components/MobileLoginScreen', () => ({ MobileLoginScreen: () => 'LOGIN' }));
jest.mock('../src/components/NewJobAlertModal', () => ({ NewJobAlertModal: () => null }));

import App from '../App';

const render = async (user: typeof mockUser): Promise<string> => {
  mockUser = user;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  return JSON.stringify(renderer.toJSON());
};

describe('role based app routing', () => {
  it('shows the login screen when signed out', async () => {
    expect(await render(null)).toContain('LOGIN');
  });

  it('gives workers the roster and worker tabs, with no role switcher', async () => {
    const tree = await render({ id: 'w1', fullName: 'Carlos Rivera', role: Role.WORKER });
    expect(tree).toContain('WORKER_ROSTER');
    expect(tree).toContain('History');
    expect(tree).toContain('Alerts');
    expect(tree).not.toContain('CUSTOMER_BOOKING');
    expect(tree).not.toContain('Customer View');
  });

  it('gives customers booking and customer tabs only', async () => {
    const tree = await render({ id: 'c1', fullName: 'Eleanor Vance', role: Role.CUSTOMER });
    expect(tree).toContain('CUSTOMER_BOOKING');
    expect(tree).toContain('Request');
    expect(tree).not.toContain('WORKER_ROSTER');
    expect(tree).not.toContain('Alerts');
  });

  it('points admin accounts to the web dashboard', async () => {
    const tree = await render({ id: 'a1', fullName: 'Admin', role: Role.ADMIN });
    expect(tree).toContain('Use the web dashboard');
    expect(tree).not.toContain('WORKER_ROSTER');
    expect(tree).not.toContain('CUSTOMER_BOOKING');
  });
});
