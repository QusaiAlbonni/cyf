import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SubmissionStatus } from '../../database/entities';

const reviewStatuses = [
  SubmissionStatus.REVIEWED,
  SubmissionStatus.NEEDS_CHANGES,
  SubmissionStatus.ACCEPTED,
  SubmissionStatus.REJECTED,
] as const;

export class SubmissionSkillRatingDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  skillId!: number;

  @ApiProperty({ minimum: 0, maximum: 10, example: 8.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  rating!: number;

  @ApiProperty({ required: false, maxLength: 2048 })
  @IsString()
  @MaxLength(2048)
  @IsOptional()
  notes?: string | null;
}

export class SubmissionReviewDto {
  @ApiProperty({
    enum: reviewStatuses,
    enumName: 'SubmissionReviewStatus',
  })
  @IsIn(reviewStatuses)
  status!: (typeof reviewStatuses)[number];

  @ApiProperty({ required: false, maxLength: 4096 })
  @IsString()
  @MaxLength(4096)
  @IsOptional()
  notes?: string | null;

  @ApiProperty({
    type: SubmissionSkillRatingDto,
    isArray: true,
    required: false,
  })
  @IsArray()
  @ArrayUnique((rating: SubmissionSkillRatingDto) => rating.skillId)
  @ValidateNested({ each: true })
  @Type(() => SubmissionSkillRatingDto)
  @IsOptional()
  skillRatings?: SubmissionSkillRatingDto[];
}
