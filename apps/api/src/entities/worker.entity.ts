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

  @Column({ type: 'uniqueidentifier' })
  userId: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'float', default: 5.0 })
  rating: number;

  @Column({ type: 'simple-array', nullable: true })
  servicePillars: ServicePillar[];

  @Column({ type: 'bit', default: 1 })
  isAvailable: boolean;

  @Column({ type: 'integer', default: 0 })
  activeJobs: number;

  @Column({ type: 'float', nullable: true })
  latitude?: number | null;

  @Column({ type: 'float', nullable: true })
  longitude?: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
