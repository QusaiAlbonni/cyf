import {
  BaseEntity,
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Submission } from './submission.entity';
import { TaskSkill } from './task-skill.entity';
import { Skill } from './skill.entity';
import { User } from './user.entity';

const ratingTransformer = {
  from: (value: string | null): number | null =>
    value === null ? null : Number(value),
  to: (value: number): number => value,
};

@Check('chk_submission_skill_ratings_rating', 'rating >= 0 AND rating <= 10')
@Unique('uq_submission_skill_ratings_submission_task_skill', [
  'submissionId',
  'taskSkillId',
])
@Entity('submission_skill_ratings')
export class SubmissionSkillRating extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_submission_skill_ratings_submission_id')
  @ManyToOne(() => Submission, (submission) => submission.skillRatings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'submission_id' })
  submission!: Submission;

  @Column({ name: 'submission_id' })
  submissionId!: number;

  @Index('idx_submission_skill_ratings_task_skill_id')
  @ManyToOne(() => TaskSkill, (taskSkill) => taskSkill.submissionRatings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_skill_id' })
  taskSkill!: TaskSkill;

  @Column({ name: 'task_skill_id' })
  taskSkillId!: number;

  @Index('idx_submission_skill_ratings_skill_id')
  @ManyToOne(() => Skill, (skill) => skill.submissionRatings, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'skill_id' })
  skill!: Skill;

  @Column({ name: 'skill_id' })
  skillId!: number;

  @Index('idx_submission_skill_ratings_student_id')
  @ManyToOne(() => User, (user) => user.skillRatings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: User;

  @Column({ name: 'student_id' })
  studentId!: number;

  @Index('idx_submission_skill_ratings_reviewer_id')
  @ManyToOne(() => User, (user) => user.givenSkillRatings, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer?: User | null;

  @Column({ name: 'reviewer_id', nullable: true })
  reviewerId?: number | null;

  @Column({
    type: 'numeric',
    precision: 4,
    scale: 2,
    transformer: ratingTransformer,
  })
  rating!: number;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  notes?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
