import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import { mergeDefined } from '../common/utils';
import { Batch } from '../database/entities';
import {
  BatchCreateDto,
  BatchQueryDto,
  BatchResponseDto,
  BatchUpdateDto,
} from './dto';

@Injectable()
export class BatchService {
  constructor(
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
  ) {}

  async create(dto: BatchCreateDto) {
    await this.ensureNameIsUnique(dto.name);

    const batch = this.batchRepository.create(dto);
    const savedBatch = await this.batchRepository.save(batch);
    return plainToInstance(BatchResponseDto, savedBatch);
  }

  async getAll(query: BatchQueryDto, url: string) {
    const qb = this.batchRepository.createQueryBuilder('batch');

    if (query.search) {
      qb.andWhere(
        '(batch.name ILIKE :search OR batch.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('batch.createdAt', 'DESC');

    const options: IPaginationOptions = {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      route: url,
    };
    const result = await paginate<Batch>(qb, options);
    (result.items as BatchResponseDto[]) = plainToInstance(
      BatchResponseDto,
      result.items,
    );
    return result;
  }

  async getOne(id: number) {
    const batch = await this.findOneOrThrow(id);
    return plainToInstance(BatchResponseDto, batch);
  }

  async update(id: number, dto: BatchUpdateDto) {
    const batch = await this.findOneOrThrow(id);

    if (dto.name && dto.name !== batch.name) {
      await this.ensureNameIsUnique(dto.name);
    }

    mergeDefined(batch, dto);
    const savedBatch = await this.batchRepository.save(batch);
    return plainToInstance(BatchResponseDto, savedBatch);
  }

  async delete(id: number) {
    const batch = await this.findOneOrThrow(id);
    await this.batchRepository.remove(batch);
  }

  private async findOneOrThrow(id: number) {
    const batch = await this.batchRepository.findOneBy({ id });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    return batch;
  }

  private async ensureNameIsUnique(name: string) {
    const existingBatch = await this.batchRepository.findOneBy({ name });

    if (existingBatch) {
      throw new BadRequestException('Batch name is already in use');
    }
  }
}
