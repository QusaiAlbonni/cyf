import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BaseEntity,
} from 'typeorm';
import { User } from './user.entity';

@Index('idx_tokens_created_at', ['createdAt'])
@Entity('tokens')
export class Token extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_token_user_id', ['user'])
  @ManyToOne(() => User, (user) => user.tokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ type: 'varchar', unique: true })
  token!: string;

  @Column({ type: 'varchar', name: 'device_id', nullable: true })
  deviceId!: string | null;

  @Column({ type: 'varchar', default: 'opaque' })
  type!: string;

  @Column('timestamp', { nullable: true, default: null })
  expiresAt!: Date | null;

  @Column({ default: false })
  revoked!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
