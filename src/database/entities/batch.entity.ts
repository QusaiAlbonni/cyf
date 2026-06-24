import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';

@Entity('batches')
export class Batch extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  description?: string | null;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  startsAt?: Date | null;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt?: Date | null;

  @OneToMany(() => User, (user) => user.batch)
  students!: User[];

  @OneToMany(() => Task, (task) => task.batch)
  tasks!: Task[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
