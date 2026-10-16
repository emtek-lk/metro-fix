import { BadRequestException, HttpException } from '@nestjs/common';
import { SubscriptionTier } from '@metro-fix/core-types';
import { SubscriptionsService } from './subscriptions.service';
import { DemoCardGateway } from '../payments/demo-card-gateway';

function build(customerOver: Record<string, unknown> = {}) {
  const customer: any = { id: 'c1', userId: 'u1', subscriptionTier: null, billingCycle: null, subscribedAt: null, address: 'Colombo', ...customerOver };
  const plans: any[] = [
    { tierName: 'ACCESS', monthlyFeeLkr: 1500, annualFeeLkr: 15000, isCustomPriced: false, status: 'Active' },
    { tierName: 'ESSENTIAL', monthlyFeeLkr: 3500, annualFeeLkr: 35000, isCustomPriced: false, status: 'Active' },
    { tierName: 'BUSINESS', monthlyFeeLkr: 25000, annualFeeLkr: null, isCustomPriced: true, status: 'Active' },
  ];
  const payments: any[] = [];
  const planRepo = { findOne: jest.fn(async ({ where }: any) => plans.find((p) => p.tierName === where.tierName) ?? null) };
  const customerRepo = { findOne: jest.fn(async () => customer), save: jest.fn(async (v: any) => Object.assign(customer, v)) };
  const paymentRepo = {
    create: jest.fn((v: any) => ({ id: `p${payments.length}`, createdAt: new Date(), ...v })),
    save: jest.fn(async (v: any) => { payments.unshift(v); return v; }),
    find: jest.fn(async () => payments),
  };
  const service = new SubscriptionsService(planRepo as any, customerRepo as any, paymentRepo as any, new DemoCardGateway());
  return { service, customer, payments };
}
const good = { number: '4242 4242 4242 4242', name: 'A', expiry: '12/40', cvc: '123' };

describe('SubscriptionsService', () => {
  it('starts with no plan (a lead) and keeps the sign-up address', async () => {
    const { service } = build();
    expect(await service.getMine('u1')).toMatchObject({ tier: null, address: 'Colombo', payments: [] });
  });

  it('activates the plan after a successful charge and records the payment', async () => {
    const { service, customer } = build();
    const result = await service.checkout('u1', { tier: SubscriptionTier.ESSENTIAL, billingCycle: 'MONTHLY', card: good });
    expect(customer.subscriptionTier).toBe('ESSENTIAL');
    expect(result.payments[0]).toMatchObject({ status: 'SUCCEEDED', amountLkr: 3500, cardLast4: '4242' });
  });

  it('records a declined charge but leaves the plan alone', async () => {
    const { service, customer, payments } = build();
    await expect(
      service.checkout('u1', { tier: SubscriptionTier.ESSENTIAL, billingCycle: 'MONTHLY', card: { ...good, number: '4000 0000 0000 0002' } }),
    ).rejects.toBeInstanceOf(HttpException);
    expect(customer.subscriptionTier).toBeNull();
    expect(payments[0].status).toBe('DECLINED');
  });

  it('charges the new price when changing plan, and refuses the plan they are already on', async () => {
    const { service, payments } = build({ subscriptionTier: 'ESSENTIAL', billingCycle: 'MONTHLY' });
    await service.checkout('u1', { tier: SubscriptionTier.ACCESS, billingCycle: 'ANNUAL', card: good });
    expect(payments[0]).toMatchObject({ tier: 'ACCESS', amountLkr: 15000 });
    await expect(
      service.checkout('u1', { tier: SubscriptionTier.ACCESS, billingCycle: 'ANNUAL', card: good }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('will not sell a custom-priced plan online', async () => {
    const { service } = build();
    await expect(
      service.checkout('u1', { tier: SubscriptionTier.BUSINESS, billingCycle: 'MONTHLY', card: good }),
    ).rejects.toThrow('custom priced');
  });
});
