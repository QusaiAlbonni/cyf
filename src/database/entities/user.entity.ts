import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BaseEntity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Token } from './token.entity';
import { getCountryFromPhoneNumber } from '../../phone/utils';
import { FixedProps } from '@/common/utils';
import { Batch } from './batch.entity';
import { Specialization } from './specialization.entity';
import { Task } from './task.entity';
import { Submission } from './submission.entity';
import { SubmissionSkillRating } from './submission-skill-rating.entity';

const numericTransformer = {
  from: (value: string | null): number | null =>
    value === null ? null : Number(value),
  to: (value: number): number => value,
};

export enum Role {
  ADMIN = 'admin',
  STUDENT = 'student',
  COMPANY = 'company',
}

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
  name?: string | null;

  @Column({ name: 'username', type: 'varchar', length: 64, unique: true })
  @Index({ unique: true })
  username!: string;

  @Column({ name: 'bio', type: 'varchar', length: 2048, nullable: true })
  bio?: string | null;

  @Column({
    name: 'phone',
    type: 'varchar',
    length: 25,
    unique: true,
    nullable: true,
  })
  @Index({ unique: true })
  phone?: string | null;

  @Column({ name: 'password', type: 'varchar', length: 255, nullable: true })
  password?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_verified', type: 'boolean', default: true })
  isVerified!: boolean;

  @Column({
    name: 'role',
    type: 'enum',
    enum: Role,
    default: Role.COMPANY,
  })
  role!: Role;

  @Column({ name: 'profile_picture', type: 'varchar', nullable: true })
  profilePicture?: string | null;

  @Column({ name: 'country', type: 'varchar', nullable: true })
  country?: string | null;

  @Index('idx_users_average_rating')
  @Column({
    name: 'average_rating',
    type: 'numeric',
    precision: 4,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  averageRating!: number;

  @Column({ name: 'github_url', type: 'varchar', length: 2048, nullable: true })
  githubUrl?: string | null;

  @Column({
    name: 'linkedin_url',
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  linkedinUrl?: string | null;

  @Column({
    name: 'portfolio_url',
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  portfolioUrl?: string | null;

  @Column({ name: 'cv_url', type: 'varchar', length: 2048, nullable: true })
  cvUrl?: string | null;

  @Column({
    name: 'google_drive_url',
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  googleDriveUrl?: string | null;

  @Index('idx_users_batch_id')
  @ManyToOne(() => Batch, (batch) => batch.students, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'batch_id' })
  batch?: Batch | null;

  @Column({ name: 'batch_id', nullable: true })
  batchId?: number | null;

  @Index('idx_users_specialization_id')
  @ManyToOne(
    () => Specialization,
    (specialization) => specialization.students,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'specialization_id' })
  specialization?: Specialization | null;

  @Column({ name: 'specialization_id', nullable: true })
  specializationId?: number | null;

  @OneToMany(() => Token, (token) => token.user)
  tokens!: Token[];

  @OneToMany(() => Task, (task) => task.assignedStudent)
  assignedFinalTasks!: Task[];

  @OneToMany(() => Submission, (submission) => submission.student)
  submissions!: Submission[];

  @OneToMany(() => Submission, (submission) => submission.reviewedBy)
  reviewedSubmissions!: Submission[];

  @OneToMany(() => SubmissionSkillRating, (rating) => rating.student)
  skillRatings!: SubmissionSkillRating[];

  @OneToMany(() => SubmissionSkillRating, (rating) => rating.reviewer)
  givenSkillRatings!: SubmissionSkillRating[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  currentToken: Token | null = null;
  isAuthenticated: boolean = false;

  @BeforeInsert()
  resolveCountry() {
    this.country = this.phone ? getCountryFromPhoneNumber(this.phone) : null;
  }

  @BeforeInsert()
  activateAdmins() {
    if (this.isAdminUser) {
      this.isActive = true;
      this.isVerified = true;
    }
  }

  get fullName() {
    return this.name;
  }

  get isCustomerUser(): boolean {
    return false;
  }
  get isAdminUser(): boolean {
    return this.role === Role.ADMIN;
  }
}

export type AdminUser = FixedProps<
  InstanceType<typeof User>,
  'role',
  {
    role: Role.ADMIN;
  }
>;

export type CustomerUser = FixedProps<
  InstanceType<typeof User>,
  'role',
  {
    role: Role.COMPANY;
  }
>;
