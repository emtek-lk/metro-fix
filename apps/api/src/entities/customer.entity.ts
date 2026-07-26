import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FacilityType, SubscriptionTier } from '@metro-fix/core-types';
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

  @Column({
    type: 'varchar',
    length: 50,
    default: SubscriptionTier.BASIC,
  })
  subscriptionTier: SubscriptionTier;

  @Column({ type: 'float', nullable: true })
  latitude?: number | null;

  @Column({ type: 'float', nullable: true })
  longitude?: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
