import { passwordPolicyProblem } from '@metro-fix/core-types';

/** Shortest password accepted for the seeded staff accounts on a hosted system. */
export const STAFF_PASSWORD_MIN_LENGTH = 12;

/**
 * Reads STAFF_INITIAL_PASSWORD: the password the seeded admin and dispatcher accounts are created
 * with, instead of the public demo password. Unset (or blank) means "use the demo password", which
 * is what local development wants; in production it is required. A value that is set but too weak is rejected at start-up, so a
 * hosted system can never quietly come up with a guessable admin login.
 */
export function staffPasswordFromEnv(
  raw: string | undefined,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): string | null {
  const value = raw?.trim();
  if (!value) {
    if (nodeEnv === 'production') {
      throw new Error(
        'STAFF_INITIAL_PASSWORD must be set when NODE_ENV=production, so the seeded admin and dispatcher accounts never use the public demo password.',
      );
    }
    return null;
  }
  const problem = passwordPolicyProblem(value, STAFF_PASSWORD_MIN_LENGTH);
  if (problem) {
    throw new Error(`STAFF_INITIAL_PASSWORD is too weak: ${problem}`);
  }
  return value;
}
