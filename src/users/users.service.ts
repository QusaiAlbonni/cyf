import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AdminCreateUserDto, UserCreateDto } from './dto/user-create.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User } from '../database/entities';
import { Repository } from 'typeorm';
import { QueryUserDto, UserResponseDto, UserUpdateDto } from './dto';
import { plainToInstance } from 'class-transformer';
import { AuthService } from '../auth/services/auth.service';
import { StoredFile } from '../storage/types/file';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { mergeDefined } from '@/common/utils';
import { AuthenticatedUserResponseDto } from '../auth/dto';
import { Ordering } from '../database/types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async getAll(query: QueryUserDto, url: string) {
    const qb = this.buildQB(query);

    let page = query.page ?? 1;
    const limit = query.limit ?? 100;

    if (!page) page = 1;

    const options: IPaginationOptions = { page, limit, route: url };
    const paginatedResult = await paginate<User>(qb, options);

    (paginatedResult.items as UserResponseDto[]) = plainToInstance(
      UserResponseDto,
      paginatedResult.items,
    );
    return paginatedResult;
  }

  async getStudents(query: QueryUserDto, url: string) {
    return this.getAll(
      {
        ...query,
        role: Role.STUDENT,
        orderBy: 'average_rating' as QueryUserDto['orderBy'],
        ordering: Ordering.DESC,
      },
      url,
    );
  }

  getMe(user: User) {
    return plainToInstance(UserResponseDto, user);
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async editUser(
    user: User,
    dto: UserUpdateDto,
    profilePicture: StoredFile | undefined,
  ) {
    this.applyModerationRules(profilePicture);

    if (profilePicture) {
      user.profilePicture = profilePicture.storageKey;
    }
    mergeDefined(user, dto);
    const result = await this.userRepository.save(user);

    this.logger.info({
      message: 'user updated his profile',
      userId: result.id,
    });

    const updatedUser = await this.findById(result.id);
    return plainToInstance(UserResponseDto, updatedUser);
  }

  async findByPhone(phone: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { phone } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { username } });
  }

  async createCompany(
    userDto: UserCreateDto,
    profilePicture?: StoredFile | null,
  ): Promise<AuthenticatedUserResponseDto> {
    this.applyModerationRules(profilePicture);

    await this.checkPhoneNumberIsUnique(userDto.phone);
    await this.checkUsernameIsUnique(userDto.username);

    const userData = userDto;

    const hash = await this.authService.hashPassword(userDto.password);

    const userEntity = this.userRepository.create({
      phone: userData.phone ?? null,
      username: userData.username,
      name: userData.name,
      bio: userData.bio,
      password: hash,
      role: Role.COMPANY,
      isVerified: true,
      profilePicture: profilePicture?.storageKey,
    });

    const savedUser = await this.saveAndFetchUser(userEntity);

    this.logger.info({ message: 'Created new User', userId: savedUser.id });

    const token = await this.authService.storeOpaqueToken(
      savedUser.id,
      undefined,
      userDto.deviceId ?? null,
    );

    return {
      access_token: token.token,
      user: plainToInstance(UserResponseDto, savedUser),
    };
  }

  async createByAdmin(
    userDto: AdminCreateUserDto,
    profilePicture?: StoredFile | null,
  ) {
    this.applyModerationRules(profilePicture);
    await this.checkPhoneNumberIsUnique(userDto.phone);
    await this.checkUsernameIsUnique(userDto.username);

    if (userDto.role === Role.STUDENT && !userDto.batchId) {
      throw new BadRequestException('Batch is required for student users');
    }

    const hash = await this.authService.hashPassword(userDto.password);
    const userEntity = this.userRepository.create({
      phone: userDto.phone ?? null,
      username: userDto.username,
      name: userDto.name,
      bio: userDto.bio,
      password: hash,
      role: userDto.role,
      isVerified: true,
      profilePicture: profilePicture?.storageKey,
      batchId: userDto.role === Role.STUDENT ? userDto.batchId : null,
      specializationId: userDto.specializationId,
    });

    const savedUser = await this.saveAndFetchUser(userEntity);

    this.logger.info({
      message: 'Admin created new user',
      userId: savedUser.id,
      role: savedUser.role,
    });

    return plainToInstance(UserResponseDto, savedUser);
  }

  applyModerationRules(_profilePicture?: StoredFile | null, _user?: User) {
    return;
  }

  private async checkPhoneNumberIsUnique(phone?: string | null) {
    if (!phone) {
      return;
    }

    const existingUser = await this.userRepository.findOneBy({ phone });
    if (existingUser) {
      this.logger.info({
        message: 'Attempted registration with an existing phone number',
        userId: existingUser.id,
      });
      throw new BadRequestException([
        'لم نسطتع تسجيل حسابك بهذا الرقم اذا كنت بالفعل تملك حسابا بهذا الرقم حاول نسجيل الدخول باستخدامه',
      ]);
    }
  }

  private async checkUsernameIsUnique(username: string) {
    const existingUser = await this.userRepository.findOneBy({ username });
    if (existingUser) {
      this.logger.info({
        message: 'Attempted registration with an existing username',
        userId: existingUser.id,
      });
      throw new BadRequestException(['Username is already in use']);
    }
  }

  async saveAndFetchUser(userEntity: User) {
    const savedUser = await this.userRepository.save(userEntity);
    const fetchedUser = await this.findById(savedUser.id);
    if (!fetchedUser) throw new InternalServerErrorException();
    return fetchedUser;
  }

  async deleteUser(id: number) {
    const user = await this.findById(id);

    if (!user) throw new NotFoundException(['غير موجود']);

    if (user?.role === Role.ADMIN)
      throw new ForbiddenException(['لا يمكن حذف حساب المستخدم المسؤول']);

    const result = await this.userRepository.remove(user);

    this.logger.info({ message: 'user account deleted', phone: user.phone });

    return result;
  }

  async activateUser(user: User) {
    user.isActive = true;
    const result = await this.userRepository.save(user);

    this.logger.info({ message: 'user account activated', userId: user.id });

    return result;
  }

  async deactivateUser(user: User) {
    user.isActive = false;
    const result = await this.userRepository.save(user);

    this.logger.warn({
      message: 'user account has been deactivated',
      userId: user.id,
    });

    return result;
  }

  async changePassword(hash: string, user: User) {
    user.password = hash;
    return await this.userRepository.save(user);
  }

  buildQB(query: QueryUserDto) {
    const {
      role,
      isVerified,
      search,
      orderBy,
      ordering,
      batchId,
      specializationId,
    } = query;

    const qb = this.userRepository.createQueryBuilder('user');

    if (role) {
      qb.andWhere('user.role = :role', { role });
    }
    if (isVerified !== undefined) {
      qb.andWhere('user.isVerified = :isVerified', { isVerified });
    }
    if (batchId) {
      qb.andWhere('user.batchId = :batchId', { batchId });
    }
    if (specializationId) {
      qb.andWhere('user.specializationId = :specializationId', {
        specializationId,
      });
    }
    if (search) {
      qb.andWhere('(user.name ILIKE :search OR user.username ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    qb.orderBy(`user.${orderBy}`, ordering);

    return qb;
  }
}
