import {
  Body,
  Controller,
  Get,
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
import {
  SubmissionCreateDto,
  SubmissionQueryDto,
  SubmissionResponseDto,
  SubmissionReviewDto,
  SubmissionUpdateDto,
} from './dto';
import { SubmissionService } from './submission.service';

@ApiBearerAuth('Bearer')
@UseGuards(OpaqueAuthGuard, RolesGuard)
@Controller('submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @ApiOperation({ summary: 'Create a submission for a task' })
  @ApiResponse({ status: 201, type: SubmissionResponseDto })
  @Roles(Role.STUDENT)
  @Post()
  create(@Body() dto: SubmissionCreateDto, @GetUser() user: User) {
    return this.submissionService.create(dto, user);
  }

  @ApiOperation({ summary: 'List submissions' })
  @ApiQuery({ type: SubmissionQueryDto })
  @ApiResponse({
    status: 200,
    type: PaginatedDto<SubmissionResponseDto>(SubmissionResponseDto),
  })
  @Roles(Role.ADMIN, Role.STUDENT)
  @Get()
  getAll(
    @Query() query: SubmissionQueryDto,
    @FullUrl() url: string,
    @GetUser() user: User,
  ) {
    return this.submissionService.getAll(query, url, user);
  }

  @ApiOperation({ summary: 'Get a submission' })
  @ApiResponse({ status: 200, type: SubmissionResponseDto })
  @Roles(Role.ADMIN, Role.STUDENT)
  @Get('/:id')
  getOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.submissionService.getOne(id, user);
  }

  @ApiOperation({
    summary: 'Update a submission before deadline or after requested changes',
  })
  @ApiResponse({ status: 200, type: SubmissionResponseDto })
  @Roles(Role.STUDENT)
  @Patch('/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmissionUpdateDto,
    @GetUser() user: User,
  ) {
    return this.submissionService.update(id, dto, user);
  }

  @ApiOperation({ summary: 'Review a submission' })
  @ApiResponse({ status: 200, type: SubmissionResponseDto })
  @Roles(Role.ADMIN)
  @Patch('/:id/review')
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmissionReviewDto,
    @GetUser() user: User,
  ) {
    return this.submissionService.review(id, dto, user);
  }
}
