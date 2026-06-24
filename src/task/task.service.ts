import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { DataSource, In, Repository } from 'typeorm';
import {
  Batch,
  Role,
  Skill,
  Submission,
  SubmissionLinkType,
  Task,
  TaskRequiredLink,
  TaskSkill,
  TaskType,
  User,
} from '../database/entities';
import {
  TaskCreateDto,
  TaskQueryDto,
  TaskResponseDto,
  TaskUpdateDto,
} from './dto';

@Injectable()
export class TaskService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
  ) {}

  async create(dto: TaskCreateDto) {
    const type = dto.type ?? TaskType.REGULAR;
    const requiredLinkTypes = this.normalizeRequiredLinkTypes(
      type,
      dto.requiredLinkTypes,
    );

    await this.validateTaskShape(type, dto.batchId, dto.assignedStudentId);
    await this.findSkillsOrThrow(dto.skillIds);

    const savedTask = await this.dataSource.transaction(async (manager) => {
      const task = manager.create(Task, {
        title: dto.title,
        description: dto.description ?? null,
        type,
        batchId: dto.batchId,
        assignedStudentId:
          type === TaskType.FINAL ? dto.assignedStudentId : null,
        deadlineAt: new Date(dto.deadlineAt),
      });

      const result = await manager.save(task);

      await manager.save(
        requiredLinkTypes.map((linkType) =>
          manager.create(TaskRequiredLink, {
            taskId: result.id,
            type: linkType,
          }),
        ),
      );

      await manager.save(
        dto.skillIds.map((skillId) =>
          manager.create(TaskSkill, {
            taskId: result.id,
            skillId,
          }),
        ),
      );

      return result;
    });

    return this.getDetailedResponse(savedTask.id);
  }

  async getAll(query: TaskQueryDto, url: string, user: User) {
    const qb = this.taskRepository.createQueryBuilder('task');

    if (query.search) {
      qb.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.type) {
      qb.andWhere('task.type = :type', { type: query.type });
    }

    if (query.batchId) {
      qb.andWhere('task.batchId = :batchId', { batchId: query.batchId });
    }

    if (query.assignedStudentId) {
      qb.andWhere('task.assignedStudentId = :assignedStudentId', {
        assignedStudentId: query.assignedStudentId,
      });
    }

    if (user.role === Role.STUDENT) {
      qb.andWhere(
        `(
          (task.type = :regularType AND task.batchId = :studentBatchId)
          OR (task.type = :finalType AND task.assignedStudentId = :studentId)
        )`,
        {
          regularType: TaskType.REGULAR,
          finalType: TaskType.FINAL,
          studentBatchId: user.batchId ?? 0,
          studentId: user.id,
        },
      );
    }

    qb.orderBy('task.createdAt', 'DESC');

    const options: IPaginationOptions = {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      route: url,
    };
    const result = await paginate<Task>(qb, options);
    const details = await this.findDetailedByIds(
      result.items.map((task) => task.id),
    );

    (result.items as unknown as TaskResponseDto[]) = result.items.map((task) =>
      this.toResponse(details.get(task.id) ?? task),
    );
    return result;
  }

  async getOne(id: number, user: User) {
    const task = await this.findDetailedOrThrow(id);
    this.ensureCanReadTask(task, user);
    return this.toResponse(task);
  }

  async update(id: number, dto: TaskUpdateDto) {
    const task = await this.findDetailedOrThrow(id);
    const hasSubmissions = await this.submissionRepository.existsBy({
      taskId: id,
    });

    if (
      hasSubmissions &&
      (dto.requiredLinkTypes !== undefined || dto.skillIds !== undefined)
    ) {
      throw new BadRequestException(
        'Task required links and skills cannot be changed after submissions exist',
      );
    }

    const type = dto.type ?? task.type;
    const batchId = dto.batchId ?? task.batchId;
    const assignedStudentId =
      dto.assignedStudentId !== undefined
        ? dto.assignedStudentId
        : task.assignedStudentId;
    const requiredLinkTypes =
      dto.requiredLinkTypes === undefined
        ? undefined
        : this.normalizeRequiredLinkTypes(type, dto.requiredLinkTypes);

    await this.validateTaskShape(type, batchId, assignedStudentId);

    if (dto.skillIds !== undefined) {
      await this.findSkillsOrThrow(dto.skillIds);
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.update(Task, id, {
        title: dto.title ?? task.title,
        description:
          dto.description !== undefined ? dto.description : task.description,
        type,
        batchId,
        assignedStudentId: type === TaskType.FINAL ? assignedStudentId : null,
        deadlineAt:
          dto.deadlineAt !== undefined
            ? new Date(dto.deadlineAt)
            : task.deadlineAt,
      });

      if (requiredLinkTypes !== undefined) {
        await manager.delete(TaskRequiredLink, { taskId: id });
        await manager.save(
          requiredLinkTypes.map((linkType) =>
            manager.create(TaskRequiredLink, {
              taskId: id,
              type: linkType,
            }),
          ),
        );
      }

      if (dto.skillIds !== undefined) {
        await manager.delete(TaskSkill, { taskId: id });
        await manager.save(
          dto.skillIds.map((skillId) =>
            manager.create(TaskSkill, {
              taskId: id,
              skillId,
            }),
          ),
        );
      }
    });

    return this.getDetailedResponse(id);
  }

  async delete(id: number) {
    const task = await this.findDetailedOrThrow(id);
    await this.taskRepository.remove(task);
  }

  async findDetailedOrThrow(id: number) {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: {
        requiredLinks: true,
        taskSkills: {
          skill: true,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  ensureCanReadTask(task: Task, user: User) {
    if (user.role === Role.ADMIN) {
      return;
    }

    if (user.role !== Role.STUDENT || !this.studentCanAccessTask(task, user)) {
      throw new ForbiddenException('You cannot access this task');
    }
  }

  private async getDetailedResponse(id: number) {
    const task = await this.findDetailedOrThrow(id);
    return this.toResponse(task);
  }

  private async findDetailedByIds(ids: number[]) {
    if (ids.length === 0) {
      return new Map<number, Task>();
    }

    const tasks = await this.taskRepository.find({
      where: { id: In(ids) },
      relations: {
        requiredLinks: true,
        taskSkills: {
          skill: true,
        },
      },
    });

    return new Map(tasks.map((task) => [task.id, task]));
  }

  private async validateTaskShape(
    type: TaskType,
    batchId: number,
    assignedStudentId?: number | null,
  ) {
    const batchExists = await this.batchRepository.existsBy({ id: batchId });
    if (!batchExists) {
      throw new BadRequestException('Batch does not exist');
    }

    if (type === TaskType.REGULAR) {
      if (assignedStudentId) {
        throw new BadRequestException(
          'Regular tasks cannot be assigned to a single student',
        );
      }
      return;
    }

    if (!assignedStudentId) {
      throw new BadRequestException(
        'Final tasks must be assigned to a student',
      );
    }

    const student = await this.userRepository.findOneBy({
      id: assignedStudentId,
      role: Role.STUDENT,
    });

    if (!student) {
      throw new BadRequestException('Assigned student does not exist');
    }

    if (student.batchId !== batchId) {
      throw new BadRequestException(
        'Final task student must belong to the task batch',
      );
    }
  }

  private async findSkillsOrThrow(skillIds: number[]) {
    const skills = await this.skillRepository.findBy({ id: In(skillIds) });

    if (skills.length !== skillIds.length) {
      throw new BadRequestException('One or more skills do not exist');
    }

    return skills;
  }

  private normalizeRequiredLinkTypes(
    type: TaskType,
    linkTypes: SubmissionLinkType[] = [],
  ) {
    const uniqueLinkTypes = new Set(linkTypes);

    if (type === TaskType.FINAL) {
      uniqueLinkTypes.add(SubmissionLinkType.VIDEO);
    }

    return [...uniqueLinkTypes];
  }

  private studentCanAccessTask(task: Task, user: User) {
    if (task.type === TaskType.FINAL) {
      return task.assignedStudentId === user.id;
    }

    return task.batchId === user.batchId;
  }

  private toResponse(task: Task) {
    return plainToInstance(TaskResponseDto, {
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      batchId: task.batchId,
      assignedStudentId: task.assignedStudentId,
      deadlineAt: task.deadlineAt,
      requiredLinkTypes: (task.requiredLinks ?? [])
        .map((link) => link.type)
        .sort(),
      skills: (task.taskSkills ?? [])
        .map((taskSkill) => ({
          id: taskSkill.id,
          skillId: taskSkill.skillId,
          name: taskSkill.skill?.name ?? '',
        }))
        .sort((a, b) => a.skillId - b.skillId),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  }
}
