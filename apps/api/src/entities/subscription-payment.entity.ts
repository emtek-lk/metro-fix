import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import type { BillingCycle, CardBrand, SubscriptionTier } from '@metro-fix/core-types';

const numeric = {
  to: (value?: number | null) => value,
  from: (value?: string | number | null) => (value === null || value === undefined ? 0 : Number(value)),
};

/** One (demo) card charge for a plan. Only the last 4 digits and brand are ever stored. */
@Entity('subscription_payments')
export class SubscriptionPaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uniqueidentifier' })
  customerId!: string;

  @Column({ type: 'varchar', length: 50 })
  tier!: SubscriptionTier;

  @Column({ type: 'varchar', length: 20 })
  billingCycle!: BillingCycle;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: numeric })
  amountLkr!: number;

  @Column({ type: 'varchar', length: 20 })
  cardBrand!: CardBrand;

  @Column({ type: 'varchar', length: 4 })
  cardLast4!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: 'SUCCEEDED' | 'DECLINED';

  @Column({ type: 'varchar', length: 64 })
  reference!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
