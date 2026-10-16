import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FacilityType, type BillingCycle, type SubscriptionTier } from '@metro-fix/core-types';
import { UserEntity } from './user.entity';

@Entity('customers')
export class CustomerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier' })
  userId: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({
    type: 'varchar',
    length: 50,
    default: FacilityType.RESIDENTIAL,
  })
  facilityType: FacilityType;

  /** Null until the customer picks and pays for a plan. Without one they cannot raise requests. */
  @Column({ type: 'varchar', length: 50, nullable: true })
  subscriptionTier?: SubscriptionTier | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  billingCycle?: BillingCycle | null;

  @Column({ type: 'datetime', nullable: true })
  subscribedAt?: Date | null;

  /** Optional site / billing address given at sign-up. */
  @Column({ type: 'varchar', length: 300, nullable: true })
  address?: string | null;

  /** The business or household name shown to dispatch (optional). */
  @Column({ type: 'varchar', length: 200, nullable: true })
  companyName?: string | null;

  @Column({ type: 'float', nullable: true })
  latitude?: number | null;

  @Column({ type: 'float', nullable: true })
  longitude?: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
