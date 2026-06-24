import { PartialType } from '@nestjs/swagger';
import { SkillCreateDto } from './skill-create.dto';

export class SkillUpdateDto extends PartialType(SkillCreateDto) {}
