import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JobStatus, FacilityType, ServicePillar } from '@metro-fix/core-types';
import { CustomerEntity } from './customer.entity';
import { WorkerEntity } from './worker.entity';

@Entity('service_requests')
export class ServiceRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ServicePillar,
  })
  servicePillar: ServicePillar;

  @Column({
    type: 'enum',
    enum: FacilityType,
  })
  facilityType: FacilityType;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.REQUESTED,
  })
  status: JobStatus;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => CustomerEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'customerId' })
  customer: CustomerEntity;

  @Column({ type: 'uuid', nullable: true })
  workerId?: string | null;

  @ManyToOne(() => WorkerEntity, { onDelete: 'SET NULL', nullable: true, eager: true })
  @JoinColumn({ name: 'workerId' })
  worker?: WorkerEntity | null;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: { type: 'Point'; coordinates: [number, number] };

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor?: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quoteAmount?: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
