import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { SubmissionLinkType, SubmissionStatus } from '../../database/entities';

export class SubmissionLinkResponseDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty({ enum: SubmissionLinkType, enumName: 'SubmissionLinkType' })
  @Expose()
  type!: SubmissionLinkType;

  @ApiProperty()
  @Expose()
  url!: string;
}

export class SubmissionSkillRatingResponseDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  skillId!: number;

  @ApiProperty()
  @Expose()
  skillName!: string;

  @ApiProperty()
  @Expose()
  rating!: number;

  @ApiProperty({ nullable: true })
  @Expose()
  notes?: string | null;

  @ApiProperty({ nullable: true })
  @Expose()
  reviewerId?: number | null;
}

export class SubmissionResponseDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  taskId!: number;

  @ApiProperty()
  @Expose()
  studentId!: number;

  @ApiProperty({ enum: SubmissionStatus, enumName: 'SubmissionStatus' })
  @Expose()
  status!: SubmissionStatus;

  @ApiProperty({ nullable: true })
  @Expose()
  notes?: string | null;

  @ApiProperty({ nullable: true })
  @Expose()
  reviewedById?: number | null;

  @ApiProperty({ nullable: true })
  @Expose()
  reviewedAt?: Date | null;

  @ApiProperty()
  @Expose()
  isLate!: boolean;

  @ApiProperty({ type: SubmissionLinkResponseDto, isArray: true })
  @Expose()
  @Type(() => SubmissionLinkResponseDto)
  links!: SubmissionLinkResponseDto[];

  @ApiProperty({ type: SubmissionSkillRatingResponseDto, isArray: true })
  @Expose()
  @Type(() => SubmissionSkillRatingResponseDto)
  skillRatings!: SubmissionSkillRatingResponseDto[];

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;
}
