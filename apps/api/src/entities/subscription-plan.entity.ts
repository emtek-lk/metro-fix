import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionTier, FacilityType } from '@metro-fix/core-types';
import type { InspectionCadence } from '@metro-fix/core-types';

const numeric = {
  to: (value?: number | null) => value,
  from: (value?: string | number | null) => (value === null || value === undefined ? null : Number(value)),
};

@Entity('subscription_plans')
export class SubscriptionPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: SubscriptionTier.ESSENTIAL,
  })
  tierName!: SubscriptionTier;

  @Column({
    type: 'varchar',
    length: 50,
    default: FacilityType.COMMERCIAL,
  })
  targetFacility!: FacilityType;

  @Column({ type: 'varchar', length: 200, nullable: true })
  targetCustomer?: string | null;

  /** Fees in LKR. Business is custom priced, so annual may be null and monthly is a "from" price. */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, transformer: numeric })
  monthlyFeeLkr?: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, transformer: numeric })
  annualFeeLkr?: number | null;

  @Column({ type: 'bit', default: false })
  isCustomPriced!: boolean;

  /** Null means "per SLA / unlimited by agreement" (Business). */
  @Column({ type: 'int', nullable: true })
  includedVisitsPerMonth?: number | null;

  @Column({ type: 'float', nullable: true })
  includedLabourHoursPerMonth?: number | null;

  @Column({ type: 'float', default: 0 })
  labourDiscountPct!: number;

  @Column({ type: 'varchar', length: 20, default: 'NONE' })
  inspectionCadence!: InspectionCadence;

  @Column({ type: 'bit', default: false })
  callOutWaived!: boolean;

  @Column({ type: 'int', default: 0 })
  activeAccounts!: number;

  @Column({ type: 'text', nullable: true })
  includedServices?: string;

  @Column({ type: 'varchar', length: 50, default: 'Active' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
