import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SetPasswordDto {
  @ApiProperty({
    example: 'Str0ngP@ssword!',
    maxLength: 255,
    type: 'string',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(255)
  newPassword!: string;

  @ApiProperty({
    example: 'Str0ngP@ssword!',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  oldPassword!: string;
}
