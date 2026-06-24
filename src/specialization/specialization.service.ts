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
import { Specialization } from '../database/entities';
import {
  SpecializationCreateDto,
  SpecializationQueryDto,
  SpecializationResponseDto,
  SpecializationUpdateDto,
} from './dto';

@Injectable()
export class SpecializationService {
  constructor(
    @InjectRepository(Specialization)
    private readonly specializationRepository: Repository<Specialization>,
  ) {}

  async create(dto: SpecializationCreateDto) {
    await this.ensureNameIsUnique(dto.name);

    const specialization = this.specializationRepository.create(dto);
    const savedSpecialization =
      await this.specializationRepository.save(specialization);
    return plainToInstance(SpecializationResponseDto, savedSpecialization);
  }

  async getAll(query: SpecializationQueryDto, url: string) {
    const qb =
      this.specializationRepository.createQueryBuilder('specialization');

    if (query.search) {
      qb.andWhere(
        '(specialization.name ILIKE :search OR specialization.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('specialization.createdAt', 'DESC');

    const options: IPaginationOptions = {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      route: url,
    };
    const result = await paginate<Specialization>(qb, options);
    (result.items as SpecializationResponseDto[]) = plainToInstance(
      SpecializationResponseDto,
      result.items,
    );
    return result;
  }

  async getOne(id: number) {
    const specialization = await this.findOneOrThrow(id);
    return plainToInstance(SpecializationResponseDto, specialization);
  }

  async update(id: number, dto: SpecializationUpdateDto) {
    const specialization = await this.findOneOrThrow(id);

    if (dto.name && dto.name !== specialization.name) {
      await this.ensureNameIsUnique(dto.name);
    }

    mergeDefined(specialization, dto);
    const savedSpecialization =
      await this.specializationRepository.save(specialization);
    return plainToInstance(SpecializationResponseDto, savedSpecialization);
  }

  async delete(id: number) {
    const specialization = await this.findOneOrThrow(id);
    await this.specializationRepository.remove(specialization);
  }

  private async findOneOrThrow(id: number) {
    const specialization = await this.specializationRepository.findOneBy({
      id,
    });

    if (!specialization) {
      throw new NotFoundException('Specialization not found');
    }

    return specialization;
  }

  private async ensureNameIsUnique(name: string) {
    const existingSpecialization =
      await this.specializationRepository.findOneBy({ name });

    if (existingSpecialization) {
      throw new BadRequestException('Specialization name is already in use');
    }
  }
}
