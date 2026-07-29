import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionTier, FacilityType } from '@metro-fix/core-types';

@Entity('subscription_plans')
export class SubscriptionPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: SubscriptionTier.BASIC,
  })
  tierName!: SubscriptionTier;

  @Column({
    type: 'varchar',
    length: 50,
    default: FacilityType.COMMERCIAL,
  })
  targetFacility!: FacilityType;

  @Column({ type: 'varchar', length: 50, default: '$499/mo' })
  monthlyFee!: string;

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
