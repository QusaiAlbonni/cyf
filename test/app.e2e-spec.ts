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
  Specialization,
  User,
} from '../src/database/entities';
import { UsersService } from '../src/users/users.service';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';

jest.setTimeout(30000);

const request = ((supertest as unknown as { default?: SuperTestStatic })
  .default ?? supertest) as SuperTestStatic;

describe('Platform API e2e', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let batchRepository: Repository<Batch>;
  let skillRepository: Repository<Skill>;
  let specializationRepository: Repository<Specialization>;
  let adminAccessToken: string | undefined;
  let companyAccessToken: string | undefined;

  const batchName = 'Fullstack 2026 E2E';
  const catalogBatchName = 'Catalog Batch E2E';
  const skillName = 'Catalog Skill E2E';
  const specializationName = 'Catalog Specialization E2E';

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
    dataSource = app.get(DataSource);
    userRepository = dataSource.getRepository(User);
    batchRepository = dataSource.getRepository(Batch);
    skillRepository = dataSource.getRepository(Skill);
    specializationRepository = dataSource.getRepository(Specialization);

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

    await userRepository.delete({
      username: In([
        companyDto.username,
        adminDto.username,
        studentDto.username,
      ]),
    });
    await batchRepository.delete({ name: In([batchName, catalogBatchName]) });
    await skillRepository.delete({ name: skillName });
    await specializationRepository.delete({ name: specializationName });
    adminAccessToken = undefined;
    companyAccessToken = undefined;
  }

  async function createAdminToken() {
    if (adminAccessToken) {
      return adminAccessToken;
    }

    const existingAdmin = await usersService.findByUsername(adminDto.username);
    if (!existingAdmin) {
      await usersService.createByAdmin(adminDto, null);
    }

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: adminDto.username,
        password: adminDto.password,
      })
      .expect(200);

    adminAccessToken = response.body.access_token as string;
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

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: companyDto.username,
        password: companyDto.password,
      })
      .expect(200);

    companyAccessToken = response.body.access_token as string;
    return companyAccessToken;
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
});
