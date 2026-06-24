import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsPhoneFromCountries } from '../../phone/allowed-countries.decorator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Role } from '../../database/entities';
import { Transform, TransformFnParams } from 'class-transformer';

enum AdminCreatableRole {
  ADMIN = Role.ADMIN,
  STUDENT = Role.STUDENT,
}

function toOptionalInt({
  value,
}: TransformFnParams): number | null | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10);
  if (value === null) return null;
  return undefined;
}

export class UserCreateDto {
  @ApiProperty({
    example: 'John',
    required: false,
    maxLength: 255,
    type: 'string',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  @MaxLength(255, {
    message: i18nValidationMessage('validation.maxLength'),
  })
  name?: string;

  @ApiProperty({
    example: 'john.doe',
    maxLength: 64,
    type: 'string',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MaxLength(64, {
    message: i18nValidationMessage('validation.maxLength'),
  })
  username!: string;

  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  @MaxLength(2048, {
    message: i18nValidationMessage('validation.maxLength'),
  })
  bio?: string | null;

  @ApiProperty({
    example: '+9611234567',
    maxLength: 25,
    type: 'string',
    required: false,
    nullable: true,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  @IsPhoneNumber(undefined, {
    message: i18nValidationMessage('validation.isPhoneNumber'),
  })
  @IsPhoneFromCountries(['LB', 'SY'], {
    message: i18nValidationMessage('validation.isPhoneFromCountries'),
  })
  @MaxLength(25)
  phone?: string | null;

  @ApiProperty({ example: 'Str0ngP@ssword!', maxLength: 255, type: 'string' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(8, {
    message: i18nValidationMessage('validation.minLength'),
  })
  @MaxLength(255)
  password!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class AdminCreateUserDto extends UserCreateDto {
  @ApiProperty({
    example: Role.STUDENT,
    enum: AdminCreatableRole,
    enumName: 'AdminCreatableRole',
  })
  @IsEnum(AdminCreatableRole)
  role!: Role.ADMIN | Role.STUDENT;

  @ApiProperty({ example: 1, type: 'number', required: false })
  @IsOptional()
  @IsInt()
  @Transform(toOptionalInt)
  batchId?: number;

  @ApiProperty({ example: 1, type: 'number', required: false })
  @IsOptional()
  @IsInt()
  @Transform(toOptionalInt)
  specializationId?: number;
}
