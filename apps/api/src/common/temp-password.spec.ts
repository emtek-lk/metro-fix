import { passwordPolicyProblem } from '@metro-fix/core-types';
import { generateTemporaryPassword } from './temp-password';

describe('generateTemporaryPassword', () => {
  it('always satisfies the password policy and is not repeated', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const password = generateTemporaryPassword(10);
      expect(password).toHaveLength(10);
      expect(passwordPolicyProblem(password, 8)).toBeNull();
      expect(/^[A-Za-z2-9]+$/.test(password)).toBe(true);
      seen.add(password);
    }
    expect(seen.size).toBe(200);
  });

  it('never goes below 8 characters', () => {
    expect(generateTemporaryPassword(3)).toHaveLength(8);
  });
});
