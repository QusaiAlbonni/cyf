import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUrl, MaxLength } from 'class-validator';
import { SubmissionLinkType } from '../../database/entities';

export class SubmissionLinkDto {
  @ApiProperty({ enum: SubmissionLinkType, enumName: 'SubmissionLinkType' })
  @IsEnum(SubmissionLinkType)
  type!: SubmissionLinkType;

  @ApiProperty({ example: 'https://github.com/student/project' })
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  url!: string;
}
