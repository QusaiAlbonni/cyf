import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, ValidateNested } from 'class-validator';
import { SubmissionLinkDto } from './submission-link.dto';

export class SubmissionCreateDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  taskId!: number;

  @ApiProperty({ type: SubmissionLinkDto, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SubmissionLinkDto)
  links!: SubmissionLinkDto[];
}
