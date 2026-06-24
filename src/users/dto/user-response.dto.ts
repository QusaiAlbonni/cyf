import { Exclude, Expose } from 'class-transformer';
import { Token } from '../../database/entities';
import { FileUrlField } from '../../storage/decorator';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    type: 'number',
    description: 'the unique identifier of the user',
    example: 1,
  })
  @Expose()
  id!: number;

  @ApiProperty({
    type: 'string',
    description: 'the name of the user',
    example: 'John',
  })
  @Expose()
  name?: string | null;

  @ApiProperty({
    type: 'string',
    description: 'the unique username of the user',
    example: 'john.doe',
  })
  @Expose()
  username!: string;

  @Expose()
  bio?: string | null;

  @ApiProperty({
    example: '+9611234567',
    maxLength: 25,
    type: 'string',
    nullable: true,
  })
  @Expose()
  phone?: string | null;

  @ApiHideProperty()
  @Exclude()
  password?: string;

  @ApiHideProperty()
  @Exclude()
  currentToken?: Token;

  @ApiHideProperty()
  @Exclude()
  isAuthenticated?: boolean;

  @ApiProperty({
    type: 'string',
    description: 'the role of the user',
    examples: ['user', 'admin'],
  })
  @Expose()
  role!: string;

  @ApiProperty({
    type: 'string',
    description: 'the Country of the user',
    examples: ['LB', 'SY'],
  })
  @Expose()
  country!: string;

  @ApiProperty({ type: 'number', description: 'average student rating' })
  @Expose()
  averageRating!: number;

  @Expose()
  githubUrl?: string | null;

  @Expose()
  linkedinUrl?: string | null;

  @Expose()
  portfolioUrl?: string | null;

  @Expose()
  cvUrl?: string | null;

  @Expose()
  googleDriveUrl?: string | null;

  @Expose()
  batchId?: number | null;

  @Expose()
  specializationId?: number | null;

  @ApiProperty({
    type: 'string',
    description: 'the pfp of the user',
    example: 'http://localhost:3000/file/image.jpg',
  })
  @Expose()
  @FileUrlField()
  profilePicture!: string;

  @ApiProperty({
    type: 'string',
    description: 'the date in which the user was created',
    example: '2025-02-14T07:12:36.176Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    type: 'string',
    description: 'the date in which the user was updated',
    example: '2025-02-14T07:12:36.176Z',
  })
  @Expose()
  updatedAt!: Date;
}
