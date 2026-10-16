import { randomBytes } from 'crypto';
import {
  cardDigits,
  detectCardBrand,
  isValidCardCvc,
  isValidCardExpiry,
  isValidCardNumber,
  type CardBrand,
  type DemoCardInput,
} from '@metro-fix/core-types';

export interface ChargeRequest {
  amountLkr: number;
  card: DemoCardInput;
  description: string;
}

export type ChargeResult =
  | { ok: true; reference: string; brand: CardBrand; last4: string }
  | { ok: false; reference: string; brand: CardBrand; last4: string; reason: string };

/**
 * The payment seam. Anything that can charge a card implements this, so the demo gateway below can
 * be swapped for Stripe / PayHere without touching the subscription code.
 */
export interface CardPaymentGateway {
  charge(request: ChargeRequest): Promise<ChargeResult>;
}

export const CARD_PAYMENT_GATEWAY = Symbol('CARD_PAYMENT_GATEWAY');

/** Test cards, in the style of Stripe's: 4242… always works; the others fail in a known way. */
const DECLINE_CARDS: Record<string, string> = {
  '4000000000000002': 'Your card was declined.',
  '4000000000009995': 'Your card has insufficient funds.',
  '4000000000000069': 'Your card has expired.',
};

/**
 * A pretend card processor for development and demos. It checks the card the way a real form would
 * (Luhn, expiry, CVC), approves any valid card except the test decline numbers, and moves no money.
 * The card number and CVC are never stored or logged.
 */
export class DemoCardGateway implements CardPaymentGateway {
  async charge({ card }: ChargeRequest): Promise<ChargeResult> {
    const digits = cardDigits(card.number);
    const brand = detectCardBrand(digits);
    const last4 = digits.slice(-4);
    const reference = `demo_${randomBytes(6).toString('hex')}`;
    const decline = (reason: string): ChargeResult => ({ ok: false, reference, brand, last4, reason });

    if (!card.name.trim()) return decline('Enter the name on the card.');
    if (!isValidCardNumber(digits)) return decline('That card number is not valid.');
    if (!isValidCardExpiry(card.expiry)) return decline('The expiry date is not valid.');
    if (!isValidCardCvc(card.cvc, brand)) return decline('The security code is not valid.');
    if (DECLINE_CARDS[digits]) return decline(DECLINE_CARDS[digits]);

    // A moment of "processing", like a real gateway round trip.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { ok: true, reference, brand, last4 };
  }
}
