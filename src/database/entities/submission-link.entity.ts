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
import { Submission } from './submission.entity';
import { SubmissionLinkType } from './task-required-link.entity';

@Unique('uq_submission_links_submission_type', ['submissionId', 'type'])
@Entity('submission_links')
export class SubmissionLink extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_submission_links_submission_id')
  @ManyToOne(() => Submission, (submission) => submission.links, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'submission_id' })
  submission!: Submission;

  @Column({ name: 'submission_id' })
  submissionId!: number;

  @Column({ type: 'enum', enum: SubmissionLinkType })
  type!: SubmissionLinkType;

  @Column({ type: 'varchar', length: 2048 })
  url!: string;
}
