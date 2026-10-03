import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/** Who changed what and when, for settings and account administration. Append only. */
@Entity('audit_log')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  actorId?: string | null;

  @Column({ type: 'varchar', length: 120 })
  actorName!: string;

  @Column({ type: 'varchar', length: 40 })
  actorRole!: string;

  /** A short machine name, e.g. "settings.update" or "user.deactivate". */
  @Index()
  @Column({ type: 'varchar', length: 60 })
  action!: string;

  /** What it was done to, e.g. an email address or a settings section. */
  @Column({ type: 'varchar', length: 200, nullable: true })
  target?: string | null;

  /** JSON text with the details (never passwords). */
  @Column({ type: 'varchar', length: 'max', nullable: true })
  detail?: string | null;

  @Index()
  @CreateDateColumn()
  createdAt!: Date;
}
