import { PartialType } from '@nestjs/swagger';
import { BatchCreateDto } from './batch-create.dto';

export class BatchUpdateDto extends PartialType(BatchCreateDto) {}
