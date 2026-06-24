import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  Patch,
  UploadedFile,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { AdminCreateUserDto, UserCreateDto } from './dto/user-create.dto';
import { UsersService } from './users.service';
import { FullUrl, GetUser } from '../common/decorator';
import { Role } from '../database/entities';
import type { User } from '../database/entities';
import { ActiveGuard, OpaqueAuthGuard, RolesGuard } from '../auth/guard';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { UserResponseDto, UserUpdateDto } from './dto';
import { DynamicFileInterceptor } from '../storage/interceptor/file.interceptor';
import { imageFileFilter } from '../storage/utils';
import type { StoredFile } from '../storage/types/file';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthenticatedUserResponseDto } from '../auth/dto';
import { Roles } from '../auth/decorator';
import { QueryUserDto } from './dto/user-query.dto';
import { plainToInstance } from 'class-transformer';
import { PaginatedDto } from '../common/dto';
import { ApiMultipart } from '../swagger';

@UseGuards(ThrottlerGuard)
@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}
  @ApiOperation({ summary: 'Self-service company signup' })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: AuthenticatedUserResponseDto,
  })
  @ApiResponse({
    status: 415,
    description: 'Unsupported media type',
  })
  @ApiMultipart(UserCreateDto, 'profilePicture')
  @Throttle({
    default: { ttl: 1000, limit: 1 },
  })
  @UseInterceptors(
    DynamicFileInterceptor('profilePicture', 'uploads/profile', {
      limits: {
        fileSize: 1024 * 1024 * 2,
      },
    }),
  )
  @Post()
  async createUser(
    @Body() dto: UserCreateDto,
    @UploadedFile() profilePicture?: StoredFile | null,
  ): Promise<AuthenticatedUserResponseDto> {
    return this.userService.createCompany(dto, profilePicture);
  }

  @ApiOperation({ summary: 'Create an admin or student user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: UserResponseDto,
  })
  @ApiMultipart(AdminCreateUserDto, 'profilePicture')
  @UseInterceptors(
    DynamicFileInterceptor('profilePicture', 'uploads/profile', {
      limits: {
        fileSize: 1024 * 1024 * 2,
      },
    }),
  )
  @Roles(Role.ADMIN)
  @UseGuards(OpaqueAuthGuard, RolesGuard)
  @Post('/admin')
  async createUserByAdmin(
    @Body() dto: AdminCreateUserDto,
    @UploadedFile() profilePicture?: StoredFile | null,
  ): Promise<UserResponseDto> {
    return this.userService.createByAdmin(dto, profilePicture);
  }

  // GET /users/me - Get the authenticated user (static route)
  @ApiOperation({ summary: 'Get the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Authenticated user data',
    type: UserResponseDto,
  })
  @ApiBearerAuth('Bearer')
  @UseGuards(OpaqueAuthGuard)
  @Get('/me')
  getUserMe(@GetUser() user: User): UserResponseDto {
    return this.userService.getMe(user);
  }

  @ApiOperation({ summary: 'Update the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Authenticated user data',
    type: UserResponseDto,
  })
  @ApiConsumes('multipart/form-data')
  @ApiMultipart(UserUpdateDto, 'profilePicture')
  @UseInterceptors(
    DynamicFileInterceptor('profilePicture', 'uploads/profile', {
      fileFilter: imageFileFilter(),
      limits: {
        fileSize: 1024 * 1024 * 2,
      },
    }),
  )
  @Throttle({ default: { ttl: 10000, limit: 1 } })
  @UseGuards(OpaqueAuthGuard)
  @Patch('/me')
  async editUserMe(
    @GetUser() user: User,
    @UploadedFile() profilePicture: StoredFile,
    @Body() dto: UserUpdateDto,
  ) {
    return await this.userService.editUser(user, dto, profilePicture);
  }

  // DELETE /users/me - Delete the authenticated user (static route)
  @UseGuards(OpaqueAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/me')
  async deleteUserMe(@GetUser('id') id: number) {
    await this.userService.deleteUser(id);
  }

  @ApiOperation({
    summary: 'List users according to query, requires admin auth',
  })
  @ApiResponse({
    status: 200,
    type: PaginatedDto<UserResponseDto>(UserResponseDto),
  })
  @ApiQuery({ type: QueryUserDto })
  @Roles(Role.ADMIN)
  @UseGuards(OpaqueAuthGuard, RolesGuard)
  @Throttle({ default: { ttl: 500, limit: 5 } })
  @Get()
  async listAll(@Query() query: QueryUserDto, @FullUrl() url: string) {
    return this.userService.getAll(query, url);
  }

  @ApiOperation({
    summary: 'Lists students ranked by average rating',
  })
  @ApiResponse({
    status: 200,
    type: PaginatedDto<UserResponseDto>(UserResponseDto),
  })
  @ApiQuery({ type: QueryUserDto })
  @Roles(Role.ADMIN, Role.COMPANY)
  @UseGuards(OpaqueAuthGuard, RolesGuard)
  @Throttle({ default: { ttl: 500, limit: 5 } })
  @Get('/students')
  async listStudents(@Query() query: QueryUserDto, @FullUrl() url: string) {
    return this.userService.getStudents(query, url);
  }

  @ApiOperation({ summary: 'Get a user, requires admin auth' })
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
  })
  @Roles(Role.ADMIN)
  @UseGuards(OpaqueAuthGuard, RolesGuard)
  @Throttle({ default: { ttl: 500, limit: 5 } })
  @Get('/:id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException();
    }
    return plainToInstance(UserResponseDto, user);
  }

  @ApiOperation({ description: 'deletes a user, Requires Admin permission' })
  @UseGuards(OpaqueAuthGuard, ActiveGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/:id')
  async deleteUserById(@Param('id', ParseIntPipe) id: number) {
    await this.userService.deleteUser(id);
  }
}
