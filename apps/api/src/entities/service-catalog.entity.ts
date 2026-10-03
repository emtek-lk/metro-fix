import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServicePillar, ServiceGroup, SubscriptionTier } from '@metro-fix/core-types';

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

  @Column({ type: 'varchar', length: 50, nullable: true })
  serviceGroup?: ServiceGroup | null;

  @Column({ type: 'varchar', length: 'max', nullable: true })
  description?: string | null;

  /** Icon name (Feather style) used by web and mobile when rendering the catalog. */
  @Column({ type: 'varchar', length: 50, nullable: true })
  icon?: string | null;

  /** Quote-based / specialist services have no fixed price. */
  @Column({ type: 'bit', default: false })
  requiresQuote!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  /** Indicative base price in LKR; null when the service is quote-only. */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | number | null) => (value === null || value === undefined ? null : Number(value)),
    },
  })
  basePrice?: number | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: SubscriptionTier.ACCESS,
  })
  requiredSubscriptionTier!: SubscriptionTier;

  @Column({ type: 'varchar', length: 50, default: 'Active' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
