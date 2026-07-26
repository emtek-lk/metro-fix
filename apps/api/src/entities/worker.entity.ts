import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServicePillar } from '@metro-fix/core-types';
import { UserEntity } from './user.entity';

@Entity('workers')
export class WorkerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'float', default: 5.0 })
  rating: number;

  @Column({ type: 'simple-array', nullable: true })
  servicePillars: ServicePillar[];

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'integer', default: 0 })
  activeJobs: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location?: { type: 'Point'; coordinates: [number, number] };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
