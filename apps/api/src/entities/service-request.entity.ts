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

  @Column({ type: 'varchar', length: 'max' })
  description: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  servicePillar: ServicePillar;

  @Column({
    type: 'varchar',
    length: 50,
  })
  facilityType: FacilityType;

  @Column({
    type: 'varchar',
    length: 50,
    default: JobStatus.REQUESTED,
  })
  status: JobStatus;

  @Column({ type: 'uniqueidentifier' })
  customerId: string;

  @ManyToOne(() => CustomerEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'customerId' })
  customer: CustomerEntity;

  @Column({ type: 'uniqueidentifier', nullable: true })
  workerId?: string | null;

  @ManyToOne(() => WorkerEntity, { onDelete: 'NO ACTION', nullable: true, eager: true })
  @JoinColumn({ name: 'workerId' })
  worker?: WorkerEntity | null;

  @Column({ type: 'float', nullable: true })
  latitude?: number | null;

  @Column({ type: 'float', nullable: true })
  longitude?: number | null;

  @Column({ type: 'datetime', nullable: true })
  scheduledFor?: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quoteAmount?: number | null;

  @Column({ type: 'float', nullable: true })
  estimatedHours?: number | null;

  @Column({ type: 'varchar', length: 'max', nullable: true })
  quoteNotes?: string | null;

  @Column({ type: 'varchar', length: 'max', nullable: true })
  signature?: string | null;

  @Column({ type: 'simple-array', nullable: true })
  photos?: string[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
