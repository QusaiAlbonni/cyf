import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { useContainer } from 'class-validator';
import helmet from 'helmet';
import * as supertest from 'supertest';
import type { SuperTestStatic } from 'supertest';
import { DataSource, In, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import {
  Batch,
  Role,
  Skill,
  SubmissionStatus,
  Specialization,
  SubmissionLinkType,
  Task,
  TaskType,
  User,
} from '../src/database/entities';
import { UsersService } from '../src/users/users.service';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import { AuthService } from '../src/auth/services/auth.service';

jest.setTimeout(30000);

const request = ((supertest as unknown as { default?: SuperTestStatic })
  .default ?? supertest) as SuperTestStatic;

describe('Platform API e2e', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let authService: AuthService;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let batchRepository: Repository<Batch>;
  let skillRepository: Repository<Skill>;
  let specializationRepository: Repository<Specialization>;
  let taskRepository: Repository<Task>;
  let adminAccessToken: string | undefined;
  let companyAccessToken: string | undefined;
  let taskStudentAccessToken: string | undefined;
  let otherTaskStudentAccessToken: string | undefined;
  let outsideTaskStudentAccessToken: string | undefined;

  const batchName = 'Fullstack 2026 E2E';
  const catalogBatchName = 'Catalog Batch E2E';
  const taskBatchName = 'Task Batch E2E';
  const outsideTaskBatchName = 'Outside Task Batch E2E';
  const skillName = 'Catalog Skill E2E';
  const taskSkillName = 'Task Skill E2E';
  const unassignedTaskSkillName = 'Unassigned Task Skill E2E';
  const thirdTaskSkillName = 'Third Task Skill E2E';
  const specializationName = 'Catalog Specialization E2E';
  const taskSpecializationName = 'Task Specialization E2E';
  const taskTitles = [
    'Regular Task E2E',
    'Final Task E2E',
    'Past Deadline Task E2E',
    'Average Task E2E',
    'Outside Final Task E2E',
    'Rejected Regular Assignment E2E',
    'Rejected Final Assignment E2E',
    'Company Task Write E2E',
    'Unknown Skill Task E2E',
  ] as const;

  const companyDto = {
    name: 'Acme Hiring',
    username: 'acme-hiring',
    password: 'Str0ngP@ssword!',
  };

  const adminDto = {
    name: 'Admin',
    username: 'platform-admin',
    phone: '+9610000000',
    password: 'Str0ngP@ssword!',
    role: Role.ADMIN as Role.ADMIN,
  };

  const studentDto = {
    name: 'Student One',
    username: 'student-one',
    phone: '+9619111111',
    password: 'Str0ngP@ssword!',
    role: Role.STUDENT as Role.STUDENT,
  };

  const taskStudentDto = {
    name: 'Task Student',
    username: 'task-student',
    phone: '+9619222222',
    password: 'Str0ngP@ssword!',
    role: Role.STUDENT as Role.STUDENT,
  };

  const otherTaskStudentDto = {
    name: 'Other Task Student',
    username: 'other-task-student',
    phone: '+9619333333',
    password: 'Str0ngP@ssword!',
    role: Role.STUDENT as Role.STUDENT,
  };

  const outsideTaskStudentDto = {
    name: 'Outside Task Student',
    username: 'outside-task-student',
    phone: '+9619444444',
    password: 'Str0ngP@ssword!',
    role: Role.STUDENT as Role.STUDENT,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    useContainer(app.select(AppModule), { fallbackOnErrors: true });
    app.useGlobalPipes(
      new I18nValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    app.useGlobalFilters(
      new I18nValidationExceptionFilter({ detailedErrors: false }),
    );
    app.use(helmet());
    await app.init();

    usersService = app.get(UsersService);
    authService = app.get(AuthService);
    dataSource = app.get(DataSource);
    userRepository = dataSource.getRepository(User);
    batchRepository = dataSource.getRepository(Batch);
    skillRepository = dataSource.getRepository(Skill);
    specializationRepository = dataSource.getRepository(Specialization);
    taskRepository = dataSource.getRepository(Task);

    await cleanupFixtures();
  });

  afterAll(async () => {
    await cleanupFixtures();
    await app?.close();
  });

  async function cleanupFixtures() {
    if (!dataSource?.isInitialized) {
      return;
    }

    await taskRepository.delete({ title: In(taskTitles) });
    await userRepository.delete({
      username: In([
        companyDto.username,
        adminDto.username,
        studentDto.username,
        taskStudentDto.username,
        otherTaskStudentDto.username,
        outsideTaskStudentDto.username,
      ]),
    });
    await batchRepository.delete({
      name: In([
        batchName,
        catalogBatchName,
        taskBatchName,
        outsideTaskBatchName,
      ]),
    });
    await skillRepository.delete({
      name: In([
        skillName,
        taskSkillName,
        unassignedTaskSkillName,
        thirdTaskSkillName,
      ]),
    });
    await specializationRepository.delete({
      name: In([specializationName, taskSpecializationName]),
    });
    adminAccessToken = undefined;
    companyAccessToken = undefined;
    taskStudentAccessToken = undefined;
    otherTaskStudentAccessToken = undefined;
    outsideTaskStudentAccessToken = undefined;
  }

  async function createAdminToken() {
    if (adminAccessToken) {
      return adminAccessToken;
    }

    const existingAdmin = await usersService.findByUsername(adminDto.username);
    if (!existingAdmin) {
      await usersService.createByAdmin(adminDto, null);
    }

    const admin = await usersService.findByUsername(adminDto.username);
    if (!admin) {
      throw new Error('Admin fixture was not created');
    }

    const token = await authService.storeOpaqueToken(admin.id);
    adminAccessToken = token.token;
    return adminAccessToken;
  }

  async function createCompanyToken() {
    if (companyAccessToken) {
      return companyAccessToken;
    }

    const existingCompany = await usersService.findByUsername(
      companyDto.username,
    );

    if (!existingCompany) {
      await request(app.getHttpServer()).post('/users').send(companyDto);
    }

    const company = await usersService.findByUsername(companyDto.username);
    if (!company) {
      throw new Error('Company fixture was not created');
    }

    const token = await authService.storeOpaqueToken(company.id);
    companyAccessToken = token.token;
    return companyAccessToken;
  }

  async function createStudentToken(username: string) {
    const student = await usersService.findByUsername(username);
    if (!student) {
      throw new Error(`Student fixture ${username} was not created`);
    }

    const token = await authService.storeOpaqueToken(student.id);
    return token.token;
  }

  describe('company signup and username login', () => {
    it('creates a company account through self service', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(companyDto)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.username).toBe(companyDto.username);
      expect(response.body.user.role).toBe(Role.COMPANY);
      companyAccessToken = response.body.access_token as string;
    });

    it('logs in with username and rejects phone login payloads', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: companyDto.username,
          password: companyDto.password,
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          phone: '+9611234567',
          password: companyDto.password,
        })
        .expect(400);
    });
  });

  describe('admin-created students and company browsing', () => {
    let adminToken: string;
    let companyToken: string;
    let batch: Batch;

    beforeAll(async () => {
      adminToken = await createAdminToken();
      const companyLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: companyDto.username,
          password: companyDto.password,
        })
        .expect(200);
      companyToken = companyLogin.body.access_token as string;
      companyAccessToken = companyToken;

      batch = await batchRepository.save(
        batchRepository.create({
          name: batchName,
          description: 'Fullstack web development batch',
        }),
      );
    });

    it('allows admins to create a student in a batch', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...studentDto,
          batchId: batch.id,
        })
        .expect(201);

      expect(response.body.username).toBe(studentDto.username);
      expect(response.body.role).toBe(Role.STUDENT);
      expect(response.body.batchId).toBe(batch.id);
    });

    it('lets the student update profile links', async () => {
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: studentDto.username,
          password: studentDto.password,
        })
        .expect(200);

      const response = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${login.body.access_token}`)
        .send({
          githubUrl: 'https://github.com/student-one',
          linkedinUrl: 'https://www.linkedin.com/in/student-one',
          portfolioUrl: 'https://student-one.dev',
          cvUrl: 'https://drive.google.com/file/d/student-one',
          googleDriveUrl: 'https://drive.google.com/drive/folders/student-one',
        })
        .expect(200);

      expect(response.body.githubUrl).toBe('https://github.com/student-one');
    });

    it('allows companies to browse students ranked by average rating', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/students')
        .set('Authorization', `Bearer ${companyToken}`)
        .expect(200);

      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items[0].username).toBe(studentDto.username);
    });
  });

  describe('admin-managed catalogs', () => {
    let adminToken: string;
    let companyToken: string;

    beforeAll(async () => {
      adminToken = await createAdminToken();
      companyToken = await createCompanyToken();
    });

    it('allows admins to create batch, skill, and specialization records', async () => {
      const batchResponse = await request(app.getHttpServer())
        .post('/batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: catalogBatchName,
          description: 'A catalog batch created by e2e tests',
        })
        .expect(201);

      expect(batchResponse.body.name).toBe(catalogBatchName);

      const skillResponse = await request(app.getHttpServer())
        .post('/skills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: skillName,
          description: 'A catalog skill created by e2e tests',
        })
        .expect(201);

      expect(skillResponse.body.name).toBe(skillName);

      const specializationResponse = await request(app.getHttpServer())
        .post('/specializations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: specializationName,
          description: 'A catalog specialization created by e2e tests',
        })
        .expect(201);

      expect(specializationResponse.body.name).toBe(specializationName);
    });

    it('allows authenticated users to read catalog records', async () => {
      const batches = await request(app.getHttpServer())
        .get('/batches')
        .set('Authorization', `Bearer ${companyToken}`)
        .query({ search: catalogBatchName })
        .expect(200);

      expect(batches.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: catalogBatchName }),
        ]),
      );

      const skills = await request(app.getHttpServer())
        .get('/skills')
        .set('Authorization', `Bearer ${companyToken}`)
        .query({ search: skillName })
        .expect(200);

      expect(skills.body.items).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: skillName })]),
      );

      const specializations = await request(app.getHttpServer())
        .get('/specializations')
        .set('Authorization', `Bearer ${companyToken}`)
        .query({ search: specializationName })
        .expect(200);

      expect(specializations.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: specializationName }),
        ]),
      );
    });

    it('rejects non-admin catalog writes', async () => {
      await request(app.getHttpServer())
        .post('/skills')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          name: 'Rejected Skill E2E',
        })
        .expect(403);
    });
  });

  describe('task and submission workflow', () => {
    let adminToken: string;
    let companyToken: string;
    let taskStudentToken: string;
    let otherStudentToken: string;
    let outsideStudentToken: string;
    let taskBatch: Batch;
    let outsideTaskBatch: Batch;
    let taskSpecialization: Specialization;
    let taskSkill: Skill;
    let unassignedTaskSkill: Skill;
    let thirdTaskSkill: Skill;
    let taskStudent: User;
    let otherTaskStudent: User;
    let outsideTaskStudent: User;
    let regularTaskId: number;
    let finalTaskId: number;
    let finalSubmissionId: number;
    let otherRegularSubmissionId: number;

    beforeAll(async () => {
      adminToken = await createAdminToken();
      companyToken = await createCompanyToken();

      taskBatch = await batchRepository.save(
        batchRepository.create({
          name: taskBatchName,
          description: 'Batch for task/submission e2e tests',
        }),
      );
      outsideTaskBatch = await batchRepository.save(
        batchRepository.create({
          name: outsideTaskBatchName,
          description: 'Batch used for access-control e2e tests',
        }),
      );
      taskSpecialization = await specializationRepository.save(
        specializationRepository.create({
          name: taskSpecializationName,
          description: 'Specialization for student filter e2e tests',
        }),
      );
      taskSkill = await skillRepository.save(
        skillRepository.create({
          name: taskSkillName,
          description: 'Skill assigned to task e2e tests',
        }),
      );
      unassignedTaskSkill = await skillRepository.save(
        skillRepository.create({
          name: unassignedTaskSkillName,
          description: 'Skill intentionally not assigned to task e2e tests',
        }),
      );
      thirdTaskSkill = await skillRepository.save(
        skillRepository.create({
          name: thirdTaskSkillName,
          description: 'Third skill used for aggregate rating e2e tests',
        }),
      );

      await usersService.createByAdmin(
        {
          ...taskStudentDto,
          batchId: taskBatch.id,
          specializationId: taskSpecialization.id,
        },
        null,
      );
      await usersService.createByAdmin(
        {
          ...otherTaskStudentDto,
          batchId: taskBatch.id,
        },
        null,
      );
      await usersService.createByAdmin(
        {
          ...outsideTaskStudentDto,
          batchId: outsideTaskBatch.id,
        },
        null,
      );

      const foundTaskStudent = await usersService.findByUsername(
        taskStudentDto.username,
      );
      const foundOtherTaskStudent = await usersService.findByUsername(
        otherTaskStudentDto.username,
      );
      const foundOutsideTaskStudent = await usersService.findByUsername(
        outsideTaskStudentDto.username,
      );

      if (
        !foundTaskStudent ||
        !foundOtherTaskStudent ||
        !foundOutsideTaskStudent
      ) {
        throw new Error('Task student fixtures were not created');
      }

      taskStudent = foundTaskStudent;
      otherTaskStudent = foundOtherTaskStudent;
      outsideTaskStudent = foundOutsideTaskStudent;

      taskStudentToken =
        taskStudentAccessToken ??
        (await createStudentToken(taskStudentDto.username));
      taskStudentAccessToken = taskStudentToken;
      otherStudentToken =
        otherTaskStudentAccessToken ??
        (await createStudentToken(otherTaskStudentDto.username));
      otherTaskStudentAccessToken = otherStudentToken;
      outsideStudentToken =
        outsideTaskStudentAccessToken ??
        (await createStudentToken(outsideTaskStudentDto.username));
      outsideTaskStudentAccessToken = outsideStudentToken;
    });

    it('allows admins to create regular and final tasks with skills and required links', async () => {
      const regularTask = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: taskTitles[0],
          description: 'Regular task for every student in the batch',
          type: TaskType.REGULAR,
          batchId: taskBatch.id,
          deadlineAt: new Date(Date.now() + 86400000).toISOString(),
          requiredLinkTypes: [
            SubmissionLinkType.GITHUB,
            SubmissionLinkType.GOOGLE_DRIVE,
          ],
          skillIds: [taskSkill.id],
        })
        .expect(201);

      regularTaskId = regularTask.body.id as number;
      expect(regularTask.body.type).toBe(TaskType.REGULAR);
      expect(regularTask.body.requiredLinkTypes).toEqual(
        expect.arrayContaining([
          SubmissionLinkType.GITHUB,
          SubmissionLinkType.GOOGLE_DRIVE,
        ]),
      );
      expect(regularTask.body.skills).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ skillId: taskSkill.id }),
        ]),
      );

      const finalTask = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: taskTitles[1],
          description: 'Final task assigned to one student',
          type: TaskType.FINAL,
          batchId: taskBatch.id,
          assignedStudentId: taskStudent.id,
          deadlineAt: new Date(Date.now() + 86400000).toISOString(),
          requiredLinkTypes: [SubmissionLinkType.GITHUB],
          skillIds: [taskSkill.id],
        })
        .expect(201);

      finalTaskId = finalTask.body.id as number;
      expect(finalTask.body.type).toBe(TaskType.FINAL);
      expect(finalTask.body.assignedStudentId).toBe(taskStudent.id);
      expect(finalTask.body.requiredLinkTypes).toEqual(
        expect.arrayContaining([
          SubmissionLinkType.GITHUB,
          SubmissionLinkType.VIDEO,
        ]),
      );
    });

    it('rejects invalid task definitions and non-admin task writes', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          title: 'Company Task Write E2E',
          type: TaskType.REGULAR,
          batchId: taskBatch.id,
          deadlineAt: new Date(Date.now() + 86400000).toISOString(),
          skillIds: [taskSkill.id],
        })
        .expect(403);

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: taskTitles[5],
          type: TaskType.REGULAR,
          batchId: taskBatch.id,
          assignedStudentId: taskStudent.id,
          deadlineAt: new Date(Date.now() + 86400000).toISOString(),
          skillIds: [taskSkill.id],
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: taskTitles[6],
          type: TaskType.FINAL,
          batchId: taskBatch.id,
          deadlineAt: new Date(Date.now() + 86400000).toISOString(),
          skillIds: [taskSkill.id],
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: taskTitles[4],
          type: TaskType.FINAL,
          batchId: taskBatch.id,
          assignedStudentId: outsideTaskStudent.id,
          deadlineAt: new Date(Date.now() + 86400000).toISOString(),
          skillIds: [taskSkill.id],
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Unknown Skill Task E2E',
          type: TaskType.REGULAR,
          batchId: taskBatch.id,
          deadlineAt: new Date(Date.now() + 86400000).toISOString(),
          skillIds: [999999],
        })
        .expect(400);
    });

    it('shows students only their batch tasks and assigned final tasks', async () => {
      const assignedStudentTasks = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${taskStudentToken}`)
        .expect(200);

      expect(assignedStudentTasks.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: regularTaskId }),
          expect.objectContaining({ id: finalTaskId }),
        ]),
      );

      const otherStudentTasks = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .expect(200);

      expect(otherStudentTasks.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: regularTaskId }),
        ]),
      );
      expect(otherStudentTasks.body.items).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: finalTaskId })]),
      );

      await request(app.getHttpServer())
        .get(`/tasks/${finalTaskId}`)
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .expect(403);

      const outsideStudentTasks = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${outsideStudentToken}`)
        .expect(200);

      expect(outsideStudentTasks.body.items).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: regularTaskId }),
        ]),
      );
      expect(outsideStudentTasks.body.items).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: finalTaskId })]),
      );
    });

    it('filters tasks by type, batch, assigned student, and search', async () => {
      const finalTasks = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          type: TaskType.FINAL,
          batchId: taskBatch.id,
          assignedStudentId: taskStudent.id,
          search: 'Final',
        })
        .expect(200);

      expect(finalTasks.body.items).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: finalTaskId })]),
      );
      expect(finalTasks.body.items).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: regularTaskId }),
        ]),
      );
    });

    it('blocks final task submissions from other students and requires video', async () => {
      await request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .send({
          taskId: finalTaskId,
          links: [
            {
              type: SubmissionLinkType.GITHUB,
              url: 'https://github.com/other/final-task',
            },
            {
              type: SubmissionLinkType.VIDEO,
              url: 'https://www.youtube.com/watch?v=otherFinalTask',
            },
          ],
        })
        .expect(403);

      await request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${taskStudentToken}`)
        .send({
          taskId: finalTaskId,
          links: [
            {
              type: SubmissionLinkType.GITHUB,
              url: 'https://github.com/task-student/final-task',
            },
          ],
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${taskStudentToken}`)
        .send({
          taskId: finalTaskId,
          links: [
            {
              type: SubmissionLinkType.GITHUB,
              url: 'https://github.com/task-student/final-task',
            },
            {
              type: SubmissionLinkType.VIDEO,
              url: 'https://loom.com/share/task-student-final-task',
            },
          ],
        })
        .expect(400);
    });

    it('rejects invalid regular submissions and non-student submission writes', async () => {
      await request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          taskId: regularTaskId,
          links: [
            {
              type: SubmissionLinkType.GITHUB,
              url: 'https://github.com/company/should-not-submit',
            },
            {
              type: SubmissionLinkType.GOOGLE_DRIVE,
              url: 'https://drive.google.com/file/d/company',
            },
          ],
        })
        .expect(403);

      await request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${outsideStudentToken}`)
        .send({
          taskId: regularTaskId,
          links: [
            {
              type: SubmissionLinkType.GITHUB,
              url: 'https://github.com/outside/student',
            },
            {
              type: SubmissionLinkType.GOOGLE_DRIVE,
              url: 'https://drive.google.com/file/d/outside-student',
            },
          ],
        })
        .expect(403);

      await request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .send({
          taskId: regularTaskId,
          links: [
            {
              type: SubmissionLinkType.GITHUB,
              url: 'https://github.com/other/missing-drive',
            },
          ],
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .send({
          taskId: regularTaskId,
          links: [
            {
              type: SubmissionLinkType.GITHUB,
              url: 'https://github.com/other/duplicate-one',
            },
            {
              type: SubmissionLinkType.GITHUB,
              url: 'https://github.com/other/duplicate-two',
            },
            {
              type: SubmissionLinkType.GOOGLE_DRIVE,
              url: 'https://drive.google.com/file/d/duplicate',
            },
          ],
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .send({
          taskId: regularTaskId,
          links: [
            {
              type: SubmissionLinkType.GITHUB,
              url: 'https://gitlab.com/other/not-github',
            },
            {
              type: SubmissionLinkType.GOOGLE_DRIVE,
              url: 'https://drive.google.com/file/d/not-github',
            },
          ],
        })
        .expect(400);
    });

    it('lets the assigned student submit a final task once', async () => {
      const submission = await request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${taskStudentToken}`)
        .send({
          taskId: finalTaskId,
          links: [
            {
              type: SubmissionLinkType.GITHUB,
              url: 'https://github.com/task-student/final-task',
            },
            {
              type: SubmissionLinkType.VIDEO,
              url: 'https://www.youtube.com/watch?v=taskStudentFinalTask',
            },
          ],
        })
        .expect(201);

      finalSubmissionId = submission.body.id as number;
      expect(submission.body.status).toBe(SubmissionStatus.SUBMITTED);
      expect(submission.body.isLate).toBe(false);

      await request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${taskStudentToken}`)
        .send({
          taskId: finalTaskId,
          links: [
            {
              type: SubmissionLinkType.GITHUB,
              url: 'https://github.com/task-student/final-task',
            },
            {
              type: SubmissionLinkType.VIDEO,
              url: 'https://vimeo.com/123456789',
            },
          ],
        })
        .expect(400);
    });

    it('prevents changing task required links and skills after submissions exist', async () => {
      await request(app.getHttpServer())
        .patch(`/tasks/${finalTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skillIds: [taskSkill.id, unassignedTaskSkill.id],
        })
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/tasks/${finalTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          requiredLinkTypes: [
            SubmissionLinkType.GITHUB,
            SubmissionLinkType.GOOGLE_DRIVE,
          ],
        })
        .expect(400);
    });

    it('filters submissions and keeps student reads scoped to their own work', async () => {
      const otherSubmission = await request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .send({
          taskId: regularTaskId,
          links: [
            {
              type: SubmissionLinkType.GITHUB,
              url: 'https://github.com/other/regular-task',
            },
            {
              type: SubmissionLinkType.GOOGLE_DRIVE,
              url: 'https://drive.google.com/file/d/other-regular-task',
            },
          ],
        })
        .expect(201);

      otherRegularSubmissionId = otherSubmission.body.id as number;

      await request(app.getHttpServer())
        .get(`/submissions/${finalSubmissionId}`)
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .expect(403);

      const filteredSubmissions = await request(app.getHttpServer())
        .get('/submissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          taskId: regularTaskId,
          studentId: otherTaskStudent.id,
          batchId: taskBatch.id,
          status: SubmissionStatus.SUBMITTED,
        })
        .expect(200);

      expect(filteredSubmissions.body.items).toEqual([
        expect.objectContaining({
          id: otherRegularSubmissionId,
          taskId: regularTaskId,
          studentId: otherTaskStudent.id,
        }),
      ]);

      const scopedStudentSubmissions = await request(app.getHttpServer())
        .get('/submissions')
        .set('Authorization', `Bearer ${taskStudentToken}`)
        .query({
          studentId: otherTaskStudent.id,
        })
        .expect(200);

      expect(scopedStudentSubmissions.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: finalSubmissionId }),
        ]),
      );
      expect(scopedStudentSubmissions.body.items).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: otherRegularSubmissionId }),
        ]),
      );
    });

    it('lets admins review only skills assigned to the task and updates the student average rating', async () => {
      await request(app.getHttpServer())
        .patch(`/submissions/${finalSubmissionId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: SubmissionStatus.SUBMITTED,
        })
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/submissions/${finalSubmissionId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: SubmissionStatus.REVIEWED,
          skillRatings: [
            {
              skillId: taskSkill.id,
              rating: 11,
            },
          ],
        })
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/submissions/${finalSubmissionId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: SubmissionStatus.REVIEWED,
          skillRatings: [
            {
              skillId: unassignedTaskSkill.id,
              rating: 6,
            },
          ],
        })
        .expect(400);

      const reviewedSubmission = await request(app.getHttpServer())
        .patch(`/submissions/${finalSubmissionId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: SubmissionStatus.ACCEPTED,
          notes: 'Strong final submission',
          skillRatings: [
            {
              skillId: taskSkill.id,
              rating: 8.5,
              notes: 'Good implementation quality',
            },
          ],
        })
        .expect(200);

      expect(reviewedSubmission.body.status).toBe(SubmissionStatus.ACCEPTED);
      expect(reviewedSubmission.body.skillRatings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            skillId: taskSkill.id,
            rating: 8.5,
          }),
        ]),
      );

      const updatedStudent = await userRepository.findOneBy({
        id: taskStudent.id,
      });
      expect(updatedStudent).toBeTruthy();
      expect(updatedStudent?.averageRating ?? 0).toBeCloseTo(8.5);
    });

    it('averages ratings per skill first and ranks/filter students for companies', async () => {
      await request(app.getHttpServer())
        .patch(`/submissions/${otherRegularSubmissionId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: SubmissionStatus.REVIEWED,
          notes: 'Strong regular submission',
          skillRatings: [
            {
              skillId: taskSkill.id,
              rating: 9.5,
            },
          ],
        })
        .expect(200);

      const averageTask = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: taskTitles[3],
          description: 'Task with multiple skill ratings',
          type: TaskType.REGULAR,
          batchId: taskBatch.id,
          deadlineAt: new Date(Date.now() + 86400000).toISOString(),
          requiredLinkTypes: [SubmissionLinkType.LIVE_DEMO],
          skillIds: [taskSkill.id, unassignedTaskSkill.id, thirdTaskSkill.id],
        })
        .expect(201);

      const averageSubmission = await request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${taskStudentToken}`)
        .send({
          taskId: averageTask.body.id,
          links: [
            {
              type: SubmissionLinkType.LIVE_DEMO,
              url: 'https://task-student.example.com/average-task',
            },
          ],
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/submissions/${averageSubmission.body.id}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: SubmissionStatus.ACCEPTED,
          skillRatings: [
            {
              skillId: taskSkill.id,
              rating: 5,
            },
            {
              skillId: unassignedTaskSkill.id,
              rating: 7,
            },
            {
              skillId: thirdTaskSkill.id,
              rating: 10,
            },
          ],
        })
        .expect(200);

      const updatedTaskStudent = await userRepository.findOneBy({
        id: taskStudent.id,
      });
      const updatedOtherStudent = await userRepository.findOneBy({
        id: otherTaskStudent.id,
      });

      expect(updatedTaskStudent?.averageRating ?? 0).toBeCloseTo(7.92);
      expect(updatedOtherStudent?.averageRating ?? 0).toBeCloseTo(9.5);

      const rankedStudents = await request(app.getHttpServer())
        .get('/users/students')
        .set('Authorization', `Bearer ${companyToken}`)
        .query({ batchId: taskBatch.id })
        .expect(200);

      expect(rankedStudents.body.items[0]).toEqual(
        expect.objectContaining({
          username: otherTaskStudent.username,
        }),
      );
      expect(Number(rankedStudents.body.items[0].averageRating)).toBeCloseTo(
        9.5,
      );
      expect(rankedStudents.body.items[1]).toEqual(
        expect.objectContaining({
          username: taskStudent.username,
        }),
      );
      expect(Number(rankedStudents.body.items[1].averageRating)).toBeCloseTo(
        7.92,
      );

      const specializationFilteredStudents = await request(app.getHttpServer())
        .get('/users/students')
        .set('Authorization', `Bearer ${companyToken}`)
        .query({
          batchId: taskBatch.id,
          specializationId: taskSpecialization.id,
        })
        .expect(200);

      expect(specializationFilteredStudents.body.items).toEqual([
        expect.objectContaining({
          username: taskStudent.username,
        }),
      ]);

      const searchedStudents = await request(app.getHttpServer())
        .get('/users/students')
        .set('Authorization', `Bearer ${companyToken}`)
        .query({
          batchId: taskBatch.id,
          search: 'Other Task',
        })
        .expect(200);

      expect(searchedStudents.body.items).toEqual([
        expect.objectContaining({
          username: otherTaskStudent.username,
        }),
      ]);
    });

    it('blocks post-deadline edits unless admin requests changes', async () => {
      const pastTask = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: taskTitles[2],
          description: 'Past deadline task for edit rules',
          type: TaskType.REGULAR,
          batchId: taskBatch.id,
          deadlineAt: new Date(Date.now() - 86400000).toISOString(),
          requiredLinkTypes: [SubmissionLinkType.GITHUB],
          skillIds: [taskSkill.id],
        })
        .expect(201);

      const lateSubmission = await request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${taskStudentToken}`)
        .send({
          taskId: pastTask.body.id,
          links: [
            {
              type: SubmissionLinkType.GITHUB,
              url: 'https://github.com/task-student/past-task',
            },
          ],
        })
        .expect(201);

      expect(lateSubmission.body.isLate).toBe(true);

      await request(app.getHttpServer())
        .patch(`/submissions/${lateSubmission.body.id}`)
        .set('Authorization', `Bearer ${taskStudentToken}`)
        .send({
          links: [
            {
              type: SubmissionLinkType.GITHUB,
              url: 'https://github.com/task-student/past-task-edited',
            },
          ],
        })
        .expect(403);

      await request(app.getHttpServer())
        .patch(`/submissions/${lateSubmission.body.id}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: SubmissionStatus.NEEDS_CHANGES,
          notes: 'Please update the repository link',
        })
        .expect(200);

      const resubmitted = await request(app.getHttpServer())
        .patch(`/submissions/${lateSubmission.body.id}`)
        .set('Authorization', `Bearer ${taskStudentToken}`)
        .send({
          links: [
            {
              type: SubmissionLinkType.GITHUB,
              url: 'https://github.com/task-student/past-task-edited',
            },
          ],
        })
        .expect(200);

      expect(resubmitted.body.status).toBe(SubmissionStatus.SUBMITTED);
    });
  });
});
