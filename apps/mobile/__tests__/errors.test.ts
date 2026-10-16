import { getErrorMessage, getErrorStatus } from '../src/lib/errors';

const response = (status: number, data: unknown) => ({ response: { status, data }, message: `Request failed with status code ${status}` });

describe('getErrorMessage', () => {
  it("prefers the API's own message", () => {
    expect(getErrorMessage(response(409, { message: 'An account with this email already exists.' }))).toBe(
      'An account with this email already exists.',
    );
  });

  it('joins a list of validation messages', () => {
    expect(getErrorMessage(response(400, { message: ['Title is required.', 'Description is required.'] }))).toBe(
      'Title is required. Description is required.',
    );
  });

  it('reads the first field error from the validation pipe', () => {
    expect(
      getErrorMessage(response(400, { message: 'Validation failed', errors: { email: ['Enter a valid email address.'] } })),
    ).toBe('Validation failed');
    expect(getErrorMessage(response(400, { errors: { email: ['Enter a valid email address.'] } }))).toBe(
      'Enter a valid email address.',
    );
  });

  it('explains a network failure in plain words', () => {
    expect(getErrorMessage({ request: {}, message: 'Network Error' })).toContain('connection');
  });

  it('never shows axios status-code text', () => {
    expect(getErrorMessage({ response: { status: 500, data: {} }, message: 'Request failed with status code 500' })).toBe(
      'Something went wrong. Please try again.',
    );
  });

  it('uses the fallback for anything else', () => {
    expect(getErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
    expect(getErrorMessage(new Error('Boom'))).toBe('Boom');
  });
});

describe('getErrorStatus', () => {
  it('returns the HTTP status when there was a response', () => {
    expect(getErrorStatus(response(404, {}))).toBe(404);
    expect(getErrorStatus(new Error('x'))).toBeUndefined();
  });
});
