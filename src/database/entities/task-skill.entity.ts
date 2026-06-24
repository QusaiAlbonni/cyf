import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Task } from './task.entity';
import { Skill } from './skill.entity';
import { SubmissionSkillRating } from './submission-skill-rating.entity';

@Unique('uq_task_skills_task_skill', ['taskId', 'skillId'])
@Entity('task_skills')
export class TaskSkill extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_task_skills_task_id')
  @ManyToOne(() => Task, (task) => task.taskSkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task!: Task;

  @Column({ name: 'task_id' })
  taskId!: number;

  @Index('idx_task_skills_skill_id')
  @ManyToOne(() => Skill, (skill) => skill.taskSkills, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'skill_id' })
  skill!: Skill;

  @Column({ name: 'skill_id' })
  skillId!: number;

  @OneToMany(() => SubmissionSkillRating, (rating) => rating.taskSkill)
  submissionRatings!: SubmissionSkillRating[];
}
