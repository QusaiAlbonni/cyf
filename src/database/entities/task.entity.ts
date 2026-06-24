import {
  BaseEntity,
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Batch } from './batch.entity';
import { User } from './user.entity';
import { TaskRequiredLink } from './task-required-link.entity';
import { TaskSkill } from './task-skill.entity';
import { Submission } from './submission.entity';

export enum TaskType {
  REGULAR = 'regular',
  FINAL = 'final',
}

@Check(
  'chk_tasks_final_student',
  "(type = 'regular' AND assigned_student_id IS NULL) OR (type = 'final' AND assigned_student_id IS NOT NULL)",
)
@Entity('tasks')
export class Task extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 4096, nullable: true })
  description?: string | null;

  @Column({ type: 'enum', enum: TaskType, default: TaskType.REGULAR })
  type!: TaskType;

  @Index('idx_tasks_batch_id')
  @ManyToOne(() => Batch, (batch) => batch.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch!: Batch;

  @Column({ name: 'batch_id' })
  batchId!: number;

  @Index('idx_tasks_assigned_student_id')
  @ManyToOne(() => User, (user) => user.assignedFinalTasks, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assigned_student_id' })
  assignedStudent?: User | null;

  @Column({ name: 'assigned_student_id', nullable: true })
  assignedStudentId?: number | null;

  @Column({ name: 'deadline_at', type: 'timestamptz' })
  deadlineAt!: Date;

  @OneToMany(() => TaskRequiredLink, (requiredLink) => requiredLink.task)
  requiredLinks!: TaskRequiredLink[];

  @OneToMany(() => TaskSkill, (taskSkill) => taskSkill.task)
  taskSkills!: TaskSkill[];

  @OneToMany(() => Submission, (submission) => submission.task)
  submissions!: Submission[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
