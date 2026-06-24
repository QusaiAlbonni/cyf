import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto';
import { TaskType } from '../../database/entities';

export class TaskQueryDto extends PaginationQueryDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ enum: TaskType, enumName: 'TaskType', required: false })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @ApiProperty({ required: false, example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  batchId?: number;

  @ApiProperty({ required: false, example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  assignedStudentId?: number;
}
