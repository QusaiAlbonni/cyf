import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { Role } from '../../database/entities';
import { Ordering } from '../../database/types';
import { ApiProperty } from '@nestjs/swagger';

enum OrderByEnum {
  createdAt = 'created_at',
  updatedAt = 'updated_at',
  averageRating = 'average_rating',
  name = 'name',
  id = 'id',
}

function toOptionalInt({
  value,
}: TransformFnParams): number | null | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10);
  if (value === null) return null;
  return undefined;
}

export class QueryUserDto {
  @ApiProperty({ example: 'admin', enum: Role, enumName: 'UserRole' })
  @IsOptional()
  @IsEnum(Role)
  role?: string;

  @ApiProperty({ example: 'true', type: 'boolean' })
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    else return value === 'true';
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({ example: '1', type: 'number', default: 1 })
  @IsOptional()
  @IsInt()
  @Transform(toOptionalInt)
  page?: number = 1;

  @ApiProperty({ example: '10', type: 'number' })
  @IsOptional()
  @IsInt()
  @Transform(toOptionalInt)
  limit?: number;

  @ApiProperty({ example: 'Joe', type: 'string' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: '1', type: 'number', required: false })
  @IsOptional()
  @IsInt()
  @Transform(toOptionalInt)
  batchId?: number;

  @ApiProperty({ example: '1', type: 'number', required: false })
  @IsOptional()
  @IsInt()
  @Transform(toOptionalInt)
  specializationId?: number;

  @ApiProperty({
    example: OrderByEnum.id,
    enum: OrderByEnum,
    enumName: 'OrderByEnum',
    default: OrderByEnum.id,
  })
  @IsOptional()
  @IsEnum(OrderByEnum)
  orderBy?: OrderByEnum = OrderByEnum.id;

  @ApiProperty({
    example: Ordering.ASC,
    enum: Ordering,
    enumName: 'Ordering',
    default: Ordering.ASC,
  })
  @IsOptional()
  @IsEnum(Ordering)
  ordering?: Ordering = Ordering.ASC;
}
