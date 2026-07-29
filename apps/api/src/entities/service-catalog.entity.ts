import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServicePillar, SubscriptionTier } from '@metro-fix/core-types';

@Entity('service_catalog')
export class ServiceCatalogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  serviceName!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: ServicePillar.HARD,
  })
  pillarCategory!: ServicePillar;

  @Column({ type: 'varchar', length: 50, default: '$250.00' })
  basePrice!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: SubscriptionTier.BASIC,
  })
  requiredSubscriptionTier!: SubscriptionTier;

  @Column({ type: 'varchar', length: 50, default: 'Active' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
