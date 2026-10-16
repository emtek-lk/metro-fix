import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Role } from '@metro-fix/core-types';
import * as bcrypt from 'bcrypt';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  // Never returned by a query unless asked for explicitly (see AuthService.validateUser): jobs embed
  // their customer and worker users, and those objects are sent to other users and over WebSockets.
  @Column({ select: false })
  password!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: Role.CUSTOMER,
  })
  role: Role;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  pushToken?: string;

  /** Deactivated accounts cannot sign in, and their existing sessions stop working. */
  @Column({ type: 'bit', default: true })
  isActive!: boolean;

  /**
   * Set when an admin creates or resets a worker's password. The worker must choose their own
   * before anything else in the API works for them (see JwtStrategy).
   */
  @Column({ type: 'bit', default: false })
  mustChangePassword!: boolean;

  @Column({ type: 'int', default: 0 })
  failedLoginCount!: number;

  /** While in the future, sign-in is refused (too many wrong passwords). */
  @Column({ type: 'datetime', nullable: true })
  lockedUntil?: Date | null;

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password && !this.password.startsWith('$2b$') && !this.password.startsWith('$2a$')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
