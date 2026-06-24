import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto';

export class AuthenticatedUserResponseDto {
  @ApiProperty({
    type: 'string',
    example: '3d01f7d024a83aa55fa8d602d39256d87751a4e823d8e9c877e0f0b430c1652d',
  })
  access_token!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
