import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class SpecializationCreateDto {
  @ApiProperty({ example: 'Fullstack Developer', maxLength: 255 })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MaxLength(255, { message: i18nValidationMessage('validation.maxLength') })
  name!: string;

  @ApiProperty({ required: false, maxLength: 2048 })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  @MaxLength(2048, {
    message: i18nValidationMessage('validation.maxLength'),
  })
  description?: string | null;
}
