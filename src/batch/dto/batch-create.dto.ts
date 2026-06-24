import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class BatchCreateDto {
  @ApiProperty({ example: 'Fullstack 2026', maxLength: 255 })
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

  @ApiProperty({ required: false, example: '2026-01-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  startsAt?: Date | null;

  @ApiProperty({ required: false, example: '2026-06-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  endsAt?: Date | null;
}
