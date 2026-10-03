import { ConflictException, NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';

function build(taken: { id: string; email: string } | null = null) {
  const user: any = { id: 'u1', email: 'nimali@demo.local', fullName: 'Nimali Fernando', phoneNumber: '+94 77 481 2205' };
  const customer: any = { id: 'c1', userId: 'u1', user, facilityType: 'COMMERCIAL', subscriptionTier: 'PLUS', billingCycle: 'MONTHLY', subscribedAt: new Date('2026-01-01'), companyName: 'Skyline', address: 'Galle Road' };
  const customerRepo = { findOne: jest.fn(async () => customer), save: jest.fn(async (v: any) => v) };
  const userRepo = { findOne: jest.fn(async () => taken), save: jest.fn(async (v: any) => v) };
  return { service: new CustomersService(customerRepo as any, userRepo as any), customer, user };
}

describe('CustomersService.updateCustomer', () => {
  it('changes only what is sent', async () => {
    const { service, customer, user } = build();
    await service.updateCustomer('c1', { companyName: 'Skyline Towers (Pvt) Ltd', phoneNumber: '+94 77 000 1111' });
    expect(customer.companyName).toBe('Skyline Towers (Pvt) Ltd');
    expect(user.phoneNumber).toBe('+94 77 000 1111');
    expect(user.fullName).toBe('Nimali Fernando');
    expect(customer.subscriptionTier).toBe('PLUS');
  });

  it('refuses an email another account already uses, but allows keeping their own', async () => {
    const clash = build({ id: 'someone-else', email: 'x@demo.local' });
    await expect(clash.service.updateCustomer('c1', { email: 'x@demo.local' })).rejects.toBeInstanceOf(ConflictException);
    const same = build();
    await expect(same.service.updateCustomer('c1', { email: 'nimali@demo.local' })).resolves.toBeDefined();
  });

  it('turns a customer back into a lead when the plan is cleared', async () => {
    const { service, customer } = build();
    await service.updateCustomer('c1', { subscriptionTier: null });
    expect(customer).toMatchObject({ subscriptionTier: null, billingCycle: null, subscribedAt: null });
  });

  it('starts the subscription clock when a plan is comped', async () => {
    const { service, customer } = build();
    customer.subscriptionTier = null; customer.billingCycle = null; customer.subscribedAt = null;
    await service.updateCustomer('c1', { subscriptionTier: 'ESSENTIAL' as any, billingCycle: 'ANNUAL' });
    expect(customer).toMatchObject({ subscriptionTier: 'ESSENTIAL', billingCycle: 'ANNUAL' });
    expect(customer.subscribedAt).toBeInstanceOf(Date);
  });
});
