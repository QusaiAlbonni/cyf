import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BatchResponseDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  name!: string;

  @ApiProperty({ nullable: true })
  @Expose()
  description?: string | null;

  @ApiProperty({ nullable: true })
  @Expose()
  startsAt?: Date | null;

  @ApiProperty({ nullable: true })
  @Expose()
  endsAt?: Date | null;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;
}
