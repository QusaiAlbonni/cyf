import { PartialType } from '@nestjs/swagger';
import { SpecializationCreateDto } from './specialization-create.dto';

export class SpecializationUpdateDto extends PartialType(
  SpecializationCreateDto,
) {}
