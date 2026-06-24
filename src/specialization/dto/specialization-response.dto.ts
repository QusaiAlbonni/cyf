import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SpecializationResponseDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  name!: string;

  @ApiProperty({ nullable: true })
  @Expose()
  description?: string | null;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;
}
