import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { SubmissionLinkType, TaskType } from '../../database/entities';

export class TaskSkillResponseDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  skillId!: number;

  @ApiProperty()
  @Expose()
  name!: string;
}

export class TaskResponseDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  title!: string;

  @ApiProperty({ nullable: true })
  @Expose()
  description?: string | null;

  @ApiProperty({ enum: TaskType, enumName: 'TaskType' })
  @Expose()
  type!: TaskType;

  @ApiProperty()
  @Expose()
  batchId!: number;

  @ApiProperty({ nullable: true })
  @Expose()
  assignedStudentId?: number | null;

  @ApiProperty()
  @Expose()
  deadlineAt!: Date;

  @ApiProperty({
    enum: SubmissionLinkType,
    enumName: 'SubmissionLinkType',
    isArray: true,
  })
  @Expose()
  requiredLinkTypes!: SubmissionLinkType[];

  @ApiProperty({ type: TaskSkillResponseDto, isArray: true })
  @Expose()
  @Type(() => TaskSkillResponseDto)
  skills!: TaskSkillResponseDto[];

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;
}
