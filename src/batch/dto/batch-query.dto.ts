import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto';

export class BatchQueryDto extends PaginationQueryDto {
  @ApiProperty({ required: false, example: 'fullstack' })
  @IsString()
  @IsOptional()
  search?: string;
}
