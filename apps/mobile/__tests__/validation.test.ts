import { validateRegistration, RegistrationValues } from '../src/lib/validation';

const valid: RegistrationValues = {
  fullName: 'Eleanor Vance',
  email: 'eleanor@skylinetowers.com',
  phone: '+94 77 123 4567',
  password: 'Skyline2026',
  confirmPassword: 'Skyline2026',
};

describe('validateRegistration', () => {
  it('accepts a complete, valid form', () => {
    expect(validateRegistration(valid)).toEqual({});
  });

  it('flags every empty field', () => {
    const errors = validateRegistration({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    });
    expect(Object.keys(errors).sort()).toEqual(
      ['confirmPassword', 'email', 'fullName', 'password', 'phone'].sort(),
    );
  });

  it('checks the email format', () => {
    expect(validateRegistration({ ...valid, email: 'not-an-email' }).email).toBeDefined();
    expect(validateRegistration({ ...valid, email: 'a@b' }).email).toBeDefined();
    expect(validateRegistration({ ...valid, email: ' me@site.lk ' }).email).toBeUndefined();
  });

  it('counts digits in the phone number, ignoring punctuation', () => {
    expect(validateRegistration({ ...valid, phone: '12345' }).phone).toBeDefined();
    expect(validateRegistration({ ...valid, phone: '(077) 123-4567' }).phone).toBeUndefined();
    expect(validateRegistration({ ...valid, phone: '1'.repeat(16) }).phone).toBeDefined();
  });

  it('requires a password of at least 8 characters with letters and numbers', () => {
    expect(validateRegistration({ ...valid, password: 'short1', confirmPassword: 'short1' }).password).toBeDefined();
    expect(validateRegistration({ ...valid, password: 'onlyletters', confirmPassword: 'onlyletters' }).password).toBeDefined();
    expect(validateRegistration({ ...valid, password: '123456789', confirmPassword: '123456789' }).password).toBeDefined();
  });

  it('requires the confirmation to match', () => {
    expect(validateRegistration({ ...valid, confirmPassword: 'Different2026' }).confirmPassword).toBe(
      'Passwords do not match.',
    );
  });
});
