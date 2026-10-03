import { customerNameOf, customerPhoneOf, workerNameOf, coordinatesOf } from '../src/lib/jobs';

describe('job helpers', () => {
  it("reads the customer's name and phone from the attached customer", () => {
    const job: any = { customerId: 'abcd-1234', customer: { user: { fullName: ' Eleanor Vance ', phoneNumber: ' +94 77 200 0001 ' } } };
    expect(customerNameOf(job)).toBe('Eleanor Vance');
    expect(customerPhoneOf(job)).toBe('+94 77 200 0001');
  });

  it('falls back sensibly when the customer is not attached', () => {
    const job: any = { customerId: 'abcd-1234' };
    expect(customerNameOf(job)).toBe('Customer #ABCD');
    expect(customerPhoneOf(job)).toBeNull();
    expect(customerNameOf({} as any)).toBe('Customer #Ref');
  });

  it('treats a blank phone number as missing', () => {
    expect(customerPhoneOf({ customer: { user: { phoneNumber: '  ' } } } as any)).toBeNull();
  });

  it('names the worker when there is one', () => {
    expect(workerNameOf({ worker: { user: { fullName: 'Carlos Rivera' } } } as any)).toBe('Carlos Rivera');
    expect(workerNameOf({ worker: null } as any)).toBeNull();
  });

  it('formats coordinates and handles a missing position', () => {
    expect(coordinatesOf({ location: { latitude: 6.92712, longitude: 79.86121 } } as any)).toBe('6.9271, 79.8612');
    expect(coordinatesOf({ location: null } as any)).toBeNull();
    expect(coordinatesOf({} as any)).toBeNull();
  });
});
