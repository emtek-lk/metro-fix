export interface RegistrationValues {
  fullName: string;
  email: string;
  phone: string;
  /** Optional site or billing address. */
  address?: string;
  password: string;
  confirmPassword: string;
}

export type RegistrationErrors = Partial<Record<keyof RegistrationValues, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Allows +, spaces, dashes and brackets, but needs 7-15 digits overall.
const PHONE_DIGITS = /\d/g;

/** Client-side checks for the customer sign-up form. The server remains the source of truth. */
export function validateRegistration(values: RegistrationValues): RegistrationErrors {
  const errors: RegistrationErrors = {};

  if (values.fullName.trim().length < 2) errors.fullName = 'Enter your full name.';

  if (!EMAIL.test(values.email.trim())) errors.email = 'Enter a valid email address.';

  const digits = (values.phone.match(PHONE_DIGITS) ?? []).length;
  if (digits < 7 || digits > 15) errors.phone = 'Enter a valid phone number.';

  if (values.password.length < 8) errors.password = 'Use at least 8 characters.';
  else if (!/\d/.test(values.password) || !/[A-Za-z]/.test(values.password)) {
    errors.password = 'Include both letters and numbers.';
  }

  if (!errors.password && values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.';
  } else if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password.';
  }

  return errors;
}
