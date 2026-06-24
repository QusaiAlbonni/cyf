import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Task } from './task.entity';

export enum SubmissionLinkType {
  GITHUB = 'github',
  GOOGLE_DRIVE = 'google_drive',
  LINKEDIN = 'linkedin',
  LIVE_DEMO = 'live_demo',
  VIDEO = 'video',
}

@Unique('uq_task_required_links_task_type', ['taskId', 'type'])
@Entity('task_required_links')
export class TaskRequiredLink extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_task_required_links_task_id')
  @ManyToOne(() => Task, (task) => task.requiredLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task!: Task;

  @Column({ name: 'task_id' })
  taskId!: number;

  @Column({ type: 'enum', enum: SubmissionLinkType })
  type!: SubmissionLinkType;
}
