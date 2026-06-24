import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { SubmissionLinkType, TaskType } from '../../database/entities';

export class TaskCreateDto {
  @ApiProperty({ example: 'Build a portfolio API', maxLength: 255 })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MaxLength(255, { message: i18nValidationMessage('validation.maxLength') })
  title!: string;

  @ApiProperty({ required: false, maxLength: 4096 })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  @MaxLength(4096, {
    message: i18nValidationMessage('validation.maxLength'),
  })
  description?: string | null;

  @ApiProperty({
    enum: TaskType,
    enumName: 'TaskType',
    default: TaskType.REGULAR,
  })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType = TaskType.REGULAR;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  batchId!: number;

  @ApiProperty({ required: false, example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  assignedStudentId?: number | null;

  @ApiProperty({ example: '2026-08-01T23:59:59.000Z' })
  @IsDateString()
  deadlineAt!: Date;

  @ApiProperty({
    enum: SubmissionLinkType,
    enumName: 'SubmissionLinkType',
    isArray: true,
    required: false,
  })
  @IsArray()
  @ArrayUnique()
  @IsEnum(SubmissionLinkType, { each: true })
  @IsOptional()
  requiredLinkTypes?: SubmissionLinkType[];

  @ApiProperty({ type: Number, isArray: true, example: [1, 2] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  skillIds!: number[];
}
