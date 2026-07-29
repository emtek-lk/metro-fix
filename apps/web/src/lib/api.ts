/**
 * Centralized API base URL resolver for the Metro-Fix frontend.
 *
 * Reads from Vite's `import.meta.env.VITE_API_URL` at build time.
 * Falls back to `http://localhost:3000` during local development when
 * no env file is loaded (e.g. running outside of Vite).
 *
 * Usage:
 *   import { API_BASE_URL } from '@/lib/api';
 *   fetch(`${API_BASE_URL}/jobs`);
 */
export const API_BASE_URL: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:3000';
