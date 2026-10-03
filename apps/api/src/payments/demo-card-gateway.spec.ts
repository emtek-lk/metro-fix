import { DemoCardGateway } from './demo-card-gateway';

const card = (over: Partial<{ number: string; name: string; expiry: string; cvc: string }> = {}) => ({
  number: '4242 4242 4242 4242',
  name: 'A Customer',
  expiry: '12/40',
  cvc: '123',
  ...over,
});
const charge = (over = {}) => new DemoCardGateway().charge({ amountLkr: 100, card: card(over), description: 'test' });

describe('DemoCardGateway', () => {
  it('approves a valid card and keeps only brand and last 4', async () => {
    const result = await charge();
    expect(result).toMatchObject({ ok: true, brand: 'VISA', last4: '4242' });
    expect(JSON.stringify(result)).not.toContain('4242 4242 4242');
  });

  it.each([
    ['4000 0000 0000 0002', 'declined'],
    ['4000 0000 0000 9995', 'insufficient funds'],
  ])('declines the test card %s', async (number, text) => {
    const result = await charge({ number });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain(text);
  });

  it('rejects a number that fails the Luhn check, a past expiry and a short CVC', async () => {
    expect(await charge({ number: '1234 5678 9012 3456' })).toMatchObject({ ok: false });
    expect(await charge({ expiry: '01/20' })).toMatchObject({ ok: false });
    expect(await charge({ cvc: '1' })).toMatchObject({ ok: false });
    expect(await charge({ name: ' ' })).toMatchObject({ ok: false });
  });

  it('knows Mastercard and Amex', async () => {
    expect(await charge({ number: '5555 5555 5555 4444' })).toMatchObject({ ok: true, brand: 'MASTERCARD' });
    expect(await charge({ number: '3782 822463 10005', cvc: '1234' })).toMatchObject({ ok: true, brand: 'AMEX' });
  });
});
