import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

function toOptionalInt({
  value,
}: TransformFnParams): number | null | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10);
  if (value === null) return null;
  return undefined;
}

export class UserUpdateDto {
  @ApiProperty({
    example: 'John',
    required: false,
    maxLength: 50,
    type: 'string',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  @MaxLength(50, { message: i18nValidationMessage('validation.maxLength') })
  name?: string | null;

  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  @MaxLength(2048, {
    message: i18nValidationMessage('validation.maxLength'),
  })
  bio?: string | null;

  @IsUrl({}, { message: i18nValidationMessage('validation.isUrl') })
  @IsOptional()
  @MaxLength(2048, { message: i18nValidationMessage('validation.maxLength') })
  githubUrl?: string | null;

  @IsUrl({}, { message: i18nValidationMessage('validation.isUrl') })
  @IsOptional()
  @MaxLength(2048, { message: i18nValidationMessage('validation.maxLength') })
  linkedinUrl?: string | null;

  @IsUrl({}, { message: i18nValidationMessage('validation.isUrl') })
  @IsOptional()
  @MaxLength(2048, { message: i18nValidationMessage('validation.maxLength') })
  portfolioUrl?: string | null;

  @IsUrl({}, { message: i18nValidationMessage('validation.isUrl') })
  @IsOptional()
  @MaxLength(2048, { message: i18nValidationMessage('validation.maxLength') })
  cvUrl?: string | null;

  @IsUrl({}, { message: i18nValidationMessage('validation.isUrl') })
  @IsOptional()
  @MaxLength(2048, { message: i18nValidationMessage('validation.maxLength') })
  googleDriveUrl?: string | null;

  @ApiProperty({ example: 1, type: 'number', required: false })
  @IsOptional()
  @IsInt()
  @Transform(toOptionalInt)
  specializationId?: number | null;
}
