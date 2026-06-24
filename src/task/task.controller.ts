import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorator';
import { OpaqueAuthGuard, RolesGuard } from '../auth/guard';
import { FullUrl, GetUser } from '../common/decorator';
import { PaginatedDto } from '../common/dto';
import { Role } from '../database/entities';
import type { User } from '../database/entities';
import { TaskService } from './task.service';
import {
  TaskCreateDto,
  TaskQueryDto,
  TaskResponseDto,
  TaskUpdateDto,
} from './dto';

@ApiBearerAuth('Bearer')
@UseGuards(OpaqueAuthGuard, RolesGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @ApiOperation({ summary: 'Create a task' })
  @ApiResponse({ status: 201, type: TaskResponseDto })
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: TaskCreateDto) {
    return this.taskService.create(dto);
  }

  @ApiOperation({ summary: 'List tasks' })
  @ApiQuery({ type: TaskQueryDto })
  @ApiResponse({
    status: 200,
    type: PaginatedDto<TaskResponseDto>(TaskResponseDto),
  })
  @Roles(Role.ADMIN, Role.STUDENT)
  @Get()
  getAll(
    @Query() query: TaskQueryDto,
    @FullUrl() url: string,
    @GetUser() user: User,
  ) {
    return this.taskService.getAll(query, url, user);
  }

  @ApiOperation({ summary: 'Get a task' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  @Roles(Role.ADMIN, Role.STUDENT)
  @Get('/:id')
  getOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.taskService.getOne(id, user);
  }

  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  @Roles(Role.ADMIN)
  @Patch('/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: TaskUpdateDto) {
    return this.taskService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a task' })
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/:id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.delete(id);
  }
}
