import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto';
import { SubmissionStatus } from '../../database/entities';

export class SubmissionQueryDto extends PaginationQueryDto {
  @ApiProperty({ required: false, example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  taskId?: number;

  @ApiProperty({ required: false, example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  studentId?: number;

  @ApiProperty({ required: false, example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  batchId?: number;

  @ApiProperty({
    enum: SubmissionStatus,
    enumName: 'SubmissionStatus',
    required: false,
  })
  @IsEnum(SubmissionStatus)
  @IsOptional()
  status?: SubmissionStatus;
}
