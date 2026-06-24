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
import { Skill } from '../database/entities';
import {
  SkillCreateDto,
  SkillQueryDto,
  SkillResponseDto,
  SkillUpdateDto,
} from './dto';

@Injectable()
export class SkillService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  async create(dto: SkillCreateDto) {
    await this.ensureNameIsUnique(dto.name);

    const skill = this.skillRepository.create(dto);
    const savedSkill = await this.skillRepository.save(skill);
    return plainToInstance(SkillResponseDto, savedSkill);
  }

  async getAll(query: SkillQueryDto, url: string) {
    const qb = this.skillRepository.createQueryBuilder('skill');

    if (query.search) {
      qb.andWhere(
        '(skill.name ILIKE :search OR skill.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('skill.createdAt', 'DESC');

    const options: IPaginationOptions = {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      route: url,
    };
    const result = await paginate<Skill>(qb, options);
    (result.items as SkillResponseDto[]) = plainToInstance(
      SkillResponseDto,
      result.items,
    );
    return result;
  }

  async getOne(id: number) {
    const skill = await this.findOneOrThrow(id);
    return plainToInstance(SkillResponseDto, skill);
  }

  async update(id: number, dto: SkillUpdateDto) {
    const skill = await this.findOneOrThrow(id);

    if (dto.name && dto.name !== skill.name) {
      await this.ensureNameIsUnique(dto.name);
    }

    mergeDefined(skill, dto);
    const savedSkill = await this.skillRepository.save(skill);
    return plainToInstance(SkillResponseDto, savedSkill);
  }

  async delete(id: number) {
    const skill = await this.findOneOrThrow(id);
    await this.skillRepository.remove(skill);
  }

  private async findOneOrThrow(id: number) {
    const skill = await this.skillRepository.findOneBy({ id });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    return skill;
  }

  private async ensureNameIsUnique(name: string) {
    const existingSkill = await this.skillRepository.findOneBy({ name });

    if (existingSkill) {
      throw new BadRequestException('Skill name is already in use');
    }
  }
}
