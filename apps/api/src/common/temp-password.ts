import { randomInt } from 'crypto';

// No 0/O/1/l/I, so a password read out over the phone or typed from a screen is not misread.
const LETTERS = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';

/** A random one-time password with letters and digits (satisfies the password policy). */
export function generateTemporaryPassword(length = 10): string {
  const size = Math.max(length, 8);
  const all = LETTERS + DIGITS;
  const chars = [LETTERS[randomInt(LETTERS.length)], DIGITS[randomInt(DIGITS.length)]];
  while (chars.length < size) chars.push(all[randomInt(all.length)]);
  // Fisher-Yates so the guaranteed letter and digit are not always first.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
