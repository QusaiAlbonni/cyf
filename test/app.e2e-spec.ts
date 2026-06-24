import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { useContainer } from 'class-validator';
import helmet from 'helmet';
import * as supertest from 'supertest';
import type { SuperTestStatic } from 'supertest';
import { DataSource, In, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Batch, Role, User } from '../src/database/entities';
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

  const batchName = 'Fullstack 2026 E2E';

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
    await batchRepository.delete({ name: batchName });
  }

  async function createAdminToken() {
    await usersService.createByAdmin(adminDto, null);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: adminDto.username,
        password: adminDto.password,
      })
      .expect(200);

    return response.body.access_token as string;
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
});
