import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    type: 'string',
    description: 'The user username',
    required: true,
    example: 'john.doe',
  })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    type: 'string',
    description: 'The user password',
    required: true,
    example: 'Str0ngP@ssword!',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}
