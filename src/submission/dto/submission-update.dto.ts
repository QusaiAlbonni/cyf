import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { SubmissionLinkDto } from './submission-link.dto';

export class SubmissionUpdateDto {
  @ApiProperty({ type: SubmissionLinkDto, isArray: true, required: false })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SubmissionLinkDto)
  @IsOptional()
  links?: SubmissionLinkDto[];
}
