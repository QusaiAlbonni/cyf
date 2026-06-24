import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Task } from './task.entity';
import { User } from './user.entity';
import { SubmissionLink } from './submission-link.entity';
import { SubmissionSkillRating } from './submission-skill-rating.entity';

export enum SubmissionStatus {
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  NEEDS_CHANGES = 'needs_changes',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Unique('uq_submissions_task_student', ['taskId', 'studentId'])
@Entity('submissions')
export class Submission extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_submissions_task_id')
  @ManyToOne(() => Task, (task) => task.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task!: Task;

  @Column({ name: 'task_id' })
  taskId!: number;

  @Index('idx_submissions_student_id')
  @ManyToOne(() => User, (user) => user.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: User;

  @Column({ name: 'student_id' })
  studentId!: number;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.SUBMITTED,
  })
  status!: SubmissionStatus;

  @Column({ type: 'varchar', length: 4096, nullable: true })
  notes?: string | null;

  @Index('idx_submissions_reviewed_by_id')
  @ManyToOne(() => User, (user) => user.reviewedSubmissions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'reviewed_by_id' })
  reviewedBy?: User | null;

  @Column({ name: 'reviewed_by_id', nullable: true })
  reviewedById?: number | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date | null;

  @OneToMany(() => SubmissionLink, (link) => link.submission)
  links!: SubmissionLink[];

  @OneToMany(() => SubmissionSkillRating, (rating) => rating.submission)
  skillRatings!: SubmissionSkillRating[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
