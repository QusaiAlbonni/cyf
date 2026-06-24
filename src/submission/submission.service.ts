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
  Role,
  Submission,
  SubmissionLink,
  SubmissionLinkType,
  SubmissionSkillRating,
  SubmissionStatus,
  Task,
  TaskType,
  User,
} from '../database/entities';
import {
  SubmissionCreateDto,
  SubmissionLinkDto,
  SubmissionQueryDto,
  SubmissionResponseDto,
  SubmissionReviewDto,
  SubmissionUpdateDto,
} from './dto';

@Injectable()
export class SubmissionService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(dto: SubmissionCreateDto, user: User) {
    this.ensureStudent(user);

    const task = await this.findTaskForSubmissionOrThrow(dto.taskId);
    this.ensureStudentCanSubmitToTask(task, user);

    const existingSubmission = await this.submissionRepository.findOneBy({
      taskId: dto.taskId,
      studentId: user.id,
    });

    if (existingSubmission) {
      throw new BadRequestException('You already submitted to this task');
    }

    const links = this.validateSubmissionLinks(task, dto.links);

    const savedSubmission = await this.dataSource.transaction(
      async (manager) => {
        const submission = manager.create(Submission, {
          taskId: dto.taskId,
          studentId: user.id,
          status: SubmissionStatus.SUBMITTED,
        });

        const result = await manager.save(submission);

        await manager.save(
          links.map((link) =>
            manager.create(SubmissionLink, {
              submissionId: result.id,
              type: link.type,
              url: link.url,
            }),
          ),
        );

        return result;
      },
    );

    return this.getDetailedResponse(savedSubmission.id);
  }

  async getAll(query: SubmissionQueryDto, url: string, user: User) {
    const qb = this.submissionRepository
      .createQueryBuilder('submission')
      .innerJoin('submission.task', 'task');

    if (query.taskId) {
      qb.andWhere('submission.taskId = :taskId', { taskId: query.taskId });
    }

    if (query.status) {
      qb.andWhere('submission.status = :status', { status: query.status });
    }

    if (query.batchId) {
      qb.andWhere('task.batchId = :batchId', { batchId: query.batchId });
    }

    if (user.role === Role.STUDENT) {
      qb.andWhere('submission.studentId = :currentStudentId', {
        currentStudentId: user.id,
      });
    } else if (query.studentId) {
      qb.andWhere('submission.studentId = :studentId', {
        studentId: query.studentId,
      });
    }

    qb.orderBy('submission.createdAt', 'DESC');

    const options: IPaginationOptions = {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      route: url,
    };
    const result = await paginate<Submission>(qb, options);
    const details = await this.findDetailedByIds(
      result.items.map((submission) => submission.id),
    );

    (result.items as unknown as SubmissionResponseDto[]) = result.items.map(
      (submission) => this.toResponse(details.get(submission.id) ?? submission),
    );
    return result;
  }

  async getOne(id: number, user: User) {
    const submission = await this.findDetailedOrThrow(id);
    this.ensureCanReadSubmission(submission, user);
    return this.toResponse(submission);
  }

  async update(id: number, dto: SubmissionUpdateDto, user: User) {
    this.ensureStudent(user);

    const submission = await this.findDetailedOrThrow(id);

    if (submission.studentId !== user.id) {
      throw new ForbiddenException('You can only edit your own submissions');
    }

    this.ensureSubmissionIsEditable(submission);

    if (dto.links === undefined) {
      return this.toResponse(submission);
    }

    const links = this.validateSubmissionLinks(submission.task, dto.links);

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(SubmissionLink, { submissionId: id });
      await manager.save(
        links.map((link) =>
          manager.create(SubmissionLink, {
            submissionId: id,
            type: link.type,
            url: link.url,
          }),
        ),
      );

      await manager.update(Submission, id, {
        status: SubmissionStatus.SUBMITTED,
      });
    });

    return this.getDetailedResponse(id);
  }

  async review(id: number, dto: SubmissionReviewDto, reviewer: User) {
    const submission = await this.findDetailedOrThrow(id);
    const ratings = dto.skillRatings ?? [];
    const taskSkillBySkillId = this.getTaskSkillBySkillId(submission.task);

    for (const rating of ratings) {
      if (!taskSkillBySkillId.has(rating.skillId)) {
        throw new BadRequestException(
          'Skill rating must target a skill assigned to this task',
        );
      }
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.update(Submission, submission.id, {
        status: dto.status,
        notes: dto.notes !== undefined ? dto.notes : submission.notes,
        reviewedById: reviewer.id,
        reviewedAt: new Date(),
      });

      for (const rating of ratings) {
        const taskSkill = taskSkillBySkillId.get(rating.skillId);

        if (!taskSkill) {
          throw new BadRequestException(
            'Skill rating must target a skill assigned to this task',
          );
        }

        const existingRating = await manager.findOne(SubmissionSkillRating, {
          where: {
            submissionId: submission.id,
            taskSkillId: taskSkill.id,
          },
        });

        await manager.save(SubmissionSkillRating, {
          ...existingRating,
          submissionId: submission.id,
          taskSkillId: taskSkill.id,
          skillId: rating.skillId,
          studentId: submission.studentId,
          reviewerId: reviewer.id,
          rating: rating.rating,
          notes: rating.notes ?? existingRating?.notes ?? null,
        });
      }

      if (ratings.length > 0) {
        await this.recomputeStudentAverage(submission.studentId, manager);
      }
    });

    return this.getDetailedResponse(id);
  }

  async findDetailedOrThrow(id: number) {
    const submission = await this.submissionRepository.findOne({
      where: { id },
      relations: {
        task: {
          requiredLinks: true,
          taskSkills: {
            skill: true,
          },
        },
        links: true,
        skillRatings: {
          skill: true,
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return submission;
  }

  private async getDetailedResponse(id: number) {
    const submission = await this.findDetailedOrThrow(id);
    return this.toResponse(submission);
  }

  private async findDetailedByIds(ids: number[]) {
    if (ids.length === 0) {
      return new Map<number, Submission>();
    }

    const submissions = await this.submissionRepository.find({
      where: { id: In(ids) },
      relations: {
        task: {
          requiredLinks: true,
          taskSkills: {
            skill: true,
          },
        },
        links: true,
        skillRatings: {
          skill: true,
        },
      },
    });

    return new Map(
      submissions.map((submission) => [submission.id, submission]),
    );
  }

  private async findTaskForSubmissionOrThrow(id: number) {
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

  private ensureStudent(user: User) {
    if (user.role !== Role.STUDENT) {
      throw new ForbiddenException('Only students can submit task work');
    }
  }

  private ensureStudentCanSubmitToTask(task: Task, user: User) {
    if (task.type === TaskType.FINAL) {
      if (task.assignedStudentId !== user.id) {
        throw new ForbiddenException(
          'You cannot submit to a final task assigned to another student',
        );
      }
      return;
    }

    if (task.batchId !== user.batchId) {
      throw new ForbiddenException('You cannot submit to another batch task');
    }
  }

  private ensureCanReadSubmission(submission: Submission, user: User) {
    if (user.role === Role.ADMIN) {
      return;
    }

    if (user.role !== Role.STUDENT || submission.studentId !== user.id) {
      throw new ForbiddenException('You cannot access this submission');
    }
  }

  private ensureSubmissionIsEditable(submission: Submission) {
    if (
      ![SubmissionStatus.SUBMITTED, SubmissionStatus.NEEDS_CHANGES].includes(
        submission.status,
      )
    ) {
      throw new ForbiddenException('Reviewed submissions cannot be edited');
    }

    const deadline = new Date(submission.task.deadlineAt);
    const isPastDeadline = Date.now() > deadline.getTime();

    if (
      isPastDeadline &&
      submission.status !== SubmissionStatus.NEEDS_CHANGES
    ) {
      throw new ForbiddenException(
        'Submissions can only be edited after the deadline when changes are requested',
      );
    }
  }

  private validateSubmissionLinks(task: Task, links: SubmissionLinkDto[]) {
    const seenTypes = new Set<SubmissionLinkType>();

    for (const link of links) {
      if (seenTypes.has(link.type)) {
        throw new BadRequestException(
          'Only one submission link is allowed per link type',
        );
      }
      seenTypes.add(link.type);
      this.validateLinkMatchesType(link);
    }

    const requiredLinkTypes = new Set(
      (task.requiredLinks ?? []).map((link) => link.type),
    );

    if (task.type === TaskType.FINAL) {
      requiredLinkTypes.add(SubmissionLinkType.VIDEO);
    }

    for (const requiredType of requiredLinkTypes) {
      if (!seenTypes.has(requiredType)) {
        throw new BadRequestException(
          `Submission is missing required ${requiredType} link`,
        );
      }
    }

    return links;
  }

  private validateLinkMatchesType(link: SubmissionLinkDto) {
    const urlValidators: Partial<Record<SubmissionLinkType, RegExp>> = {
      [SubmissionLinkType.GITHUB]: /^https:\/\/(www\.)?github\.com\/.+/i,
      [SubmissionLinkType.GOOGLE_DRIVE]: /^https:\/\/drive\.google\.com\/.+/i,
      [SubmissionLinkType.VIDEO]:
        /^https:\/\/((www\.|m\.)?youtube\.com\/(watch\?v=[A-Za-z0-9_-]+.*|shorts\/[A-Za-z0-9_-]+.*|embed\/[A-Za-z0-9_-]+.*)|youtu\.be\/[A-Za-z0-9_-]+.*|(www\.)?vimeo\.com\/[0-9]+.*|player\.vimeo\.com\/video\/[0-9]+.*)$/i,
    };
    const regex = urlValidators[link.type];

    if (regex && !regex.test(link.url)) {
      throw new BadRequestException(
        `${link.type} link does not match the expected URL format`,
      );
    }
  }

  private getTaskSkillBySkillId(task: Task) {
    return new Map(
      (task.taskSkills ?? []).map((taskSkill) => [
        taskSkill.skillId,
        taskSkill,
      ]),
    );
  }

  private async recomputeStudentAverage(
    studentId: number,
    manager = this.dataSource.manager,
  ) {
    await manager.query(
      `
        UPDATE users
        SET average_rating = COALESCE(
          (
            SELECT ROUND(AVG(skill_average)::numeric, 2)
            FROM (
              SELECT AVG(rating) AS skill_average
              FROM submission_skill_ratings
              WHERE student_id = $1
              GROUP BY skill_id
            ) skill_ratings
          ),
          0
        )
        WHERE id = $1
      `,
      [studentId],
    );
  }

  private toResponse(submission: Submission) {
    const deadlineAt = submission.task?.deadlineAt;
    const isLate = deadlineAt
      ? submission.createdAt.getTime() > new Date(deadlineAt).getTime()
      : false;

    return plainToInstance(SubmissionResponseDto, {
      id: submission.id,
      taskId: submission.taskId,
      studentId: submission.studentId,
      status: submission.status,
      notes: submission.notes,
      reviewedById: submission.reviewedById,
      reviewedAt: submission.reviewedAt,
      isLate,
      links: (submission.links ?? [])
        .map((link) => ({
          id: link.id,
          type: link.type,
          url: link.url,
        }))
        .sort((a, b) => a.type.localeCompare(b.type)),
      skillRatings: (submission.skillRatings ?? [])
        .map((rating) => ({
          id: rating.id,
          skillId: rating.skillId,
          skillName: rating.skill?.name ?? '',
          rating: rating.rating,
          notes: rating.notes,
          reviewerId: rating.reviewerId,
        }))
        .sort((a, b) => a.skillId - b.skillId),
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    });
  }
}
