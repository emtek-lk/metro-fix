import {
  counterpartHost,
  detectSurface,
  resolveApiBase,
  surfaceAllowsRole,
  Role,
} from '@metro-fix/core-types';
import { buildOriginCheck } from './cors';

describe('which website an address is', () => {
  it('treats admin.<anything> as the staff site and every other real hostname as the customer site', () => {
    expect(detectSurface('admin.metrofix.example.lk')).toBe('admin');
    expect(detectSurface('metrofix.example.lk')).toBe('customer');
    expect(detectSurface('admin.metrofix.localhost')).toBe('admin');
    expect(detectSurface('metrofix.localhost')).toBe('customer');
    expect(detectSurface('ADMIN.Metrofix.Example.lk')).toBe('admin');
  });

  it('leaves plain localhost, IPs and single-word hosts serving both, so development keeps working', () => {
    for (const host of ['localhost', '127.0.0.1', '192.168.1.20', '::1', 'web']) {
      expect(detectSurface(host)).toBe('any');
    }
  });

  it('honours a custom staff label and an explicit override', () => {
    expect(detectSurface('ops.metrofix.example.lk', { adminLabel: 'ops' })).toBe('admin');
    expect(detectSurface('admin.metrofix.example.lk', { adminLabel: 'ops' })).toBe('customer');
    expect(detectSurface('metrofix.example.lk', { surface: 'admin' })).toBe('admin');
  });

  it('keeps each audience on its own site', () => {
    expect(surfaceAllowsRole('admin', Role.ADMIN)).toBe(true);
    expect(surfaceAllowsRole('admin', Role.CUSTOMER_CARE)).toBe(true);
    expect(surfaceAllowsRole('admin', Role.CUSTOMER)).toBe(false);
    expect(surfaceAllowsRole('customer', Role.CUSTOMER)).toBe(true);
    expect(surfaceAllowsRole('customer', Role.ADMIN)).toBe(false);
    expect(surfaceAllowsRole('customer', Role.WORKER)).toBe(false);
    expect(surfaceAllowsRole('any', Role.WORKER)).toBe(true);
  });
});

describe('the other site, for "go to the right place" links', () => {
  it('adds or drops the admin label and keeps the port', () => {
    expect(counterpartHost('metrofix.example.lk', 'admin')).toBe('admin.metrofix.example.lk');
    expect(counterpartHost('admin.metrofix.example.lk', 'customer')).toBe('metrofix.example.lk');
    expect(counterpartHost('metrofix.localhost:5173', 'admin')).toBe('admin.metrofix.localhost:5173');
    expect(counterpartHost('admin.metrofix.localhost:5173', 'customer')).toBe('metrofix.localhost:5173');
    expect(counterpartHost('admin.metrofix.example.lk', 'admin')).toBe('admin.metrofix.example.lk');
  });

  it('has no counterpart for plain localhost', () => {
    expect(counterpartHost('localhost:5173', 'admin')).toBeNull();
  });
});

describe('where the API is', () => {
  const page = (hostname: string, port = '') => ({ protocol: 'https:', hostname, port });

  it('is port 3000 of this machine on localhost and *.localhost', () => {
    expect(resolveApiBase({ protocol: 'http:', hostname: 'localhost', port: '5173' })).toBe('http://localhost:3000');
    expect(resolveApiBase({ protocol: 'http:', hostname: 'metrofix.localhost', port: '5173' })).toBe('http://localhost:3000');
    expect(resolveApiBase({ protocol: 'http:', hostname: 'admin.metrofix.localhost', port: '5173' })).toBe('http://localhost:3000');
    expect(resolveApiBase({ protocol: 'http:', hostname: '192.168.1.20', port: '5173' })).toBe('http://192.168.1.20:3000');
  });

  it('is api. next to the site elsewhere, from either audience', () => {
    expect(resolveApiBase(page('metrofix.example.lk'))).toBe('https://api.metrofix.example.lk');
    expect(resolveApiBase(page('admin.metrofix.example.lk'))).toBe('https://api.metrofix.example.lk');
  });

  it('prefers an explicit address', () => {
    expect(resolveApiBase(page('metrofix.example.lk'), { apiBase: 'https://backend.example.lk/' })).toBe('https://backend.example.lk');
  });
});

describe('CORS origin check', () => {
  const prod = (CORS_ORIGINS?: string) => buildOriginCheck({ NODE_ENV: 'production', CORS_ORIGINS });
  const dev = (CORS_ORIGINS?: string) => buildOriginCheck({ NODE_ENV: 'development', CORS_ORIGINS });

  it('always lets through requests with no Origin (native apps, curl)', () => {
    expect(prod()(undefined)).toBe(true);
  });

  it('in production allows only the listed origins, with * standing for one label', () => {
    const check = prod('https://metrofix.example.lk, https://admin.metrofix.example.lk/');
    expect(check('https://metrofix.example.lk')).toBe(true);
    expect(check('https://admin.metrofix.example.lk')).toBe(true);
    expect(check('https://evil.example.com')).toBe(false);
    expect(check('http://metrofix.example.lk')).toBe(false);
    expect(check('http://localhost:5173')).toBe(false);
    expect(prod('https://*.metrofix.example.lk')('https://admin.metrofix.example.lk')).toBe(true);
    expect(prod('https://*.metrofix.example.lk')('https://a.b.metrofix.example.lk')).toBe(false);
    expect(prod()('https://metrofix.example.lk')).toBe(false);
  });

  it('in development also allows localhost and *.localhost on any port', () => {
    const check = dev();
    for (const origin of ['http://localhost:5173', 'http://127.0.0.1:8082', 'http://metrofix.localhost:5173', 'http://admin.metrofix.localhost:5173']) {
      expect(check(origin)).toBe(true);
    }
    expect(check('https://evil.example.com')).toBe(false);
    expect(check('http://localhost.evil.com')).toBe(false);
  });
});
