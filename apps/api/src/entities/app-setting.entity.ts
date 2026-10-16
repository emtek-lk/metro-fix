import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

/** Key / value store for admin-editable settings. Today one row, `app`, holds the whole settings JSON. */
@Entity('app_settings')
export class AppSettingEntity {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  key!: string;

  @Column({ type: 'varchar', length: 'max' })
  value!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  updatedBy?: string | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}
