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
import { TaskSkill } from './task-skill.entity';
import { SubmissionSkillRating } from './submission-skill-rating.entity';

@Entity('skills')
export class Skill extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  description?: string | null;

  @OneToMany(() => TaskSkill, (taskSkill) => taskSkill.skill)
  taskSkills!: TaskSkill[];

  @OneToMany(() => SubmissionSkillRating, (rating) => rating.skill)
  submissionRatings!: SubmissionSkillRating[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
