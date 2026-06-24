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
import { FullUrl } from '../common/decorator';
import { PaginatedDto } from '../common/dto';
import { Role } from '../database/entities';
import { SkillService } from './skill.service';
import {
  SkillCreateDto,
  SkillQueryDto,
  SkillResponseDto,
  SkillUpdateDto,
} from './dto';

@ApiBearerAuth('Bearer')
@UseGuards(OpaqueAuthGuard)
@Controller('skills')
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @ApiOperation({ summary: 'Create a skill' })
  @ApiResponse({ status: 201, type: SkillResponseDto })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() dto: SkillCreateDto) {
    return this.skillService.create(dto);
  }

  @ApiOperation({ summary: 'List skills' })
  @ApiQuery({ type: SkillQueryDto })
  @ApiResponse({
    status: 200,
    type: PaginatedDto<SkillResponseDto>(SkillResponseDto),
  })
  @Get()
  getAll(@Query() query: SkillQueryDto, @FullUrl() url: string) {
    return this.skillService.getAll(query, url);
  }

  @ApiOperation({ summary: 'Get a skill' })
  @ApiResponse({ status: 200, type: SkillResponseDto })
  @Get('/:id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.skillService.getOne(id);
  }

  @ApiOperation({ summary: 'Update a skill' })
  @ApiResponse({ status: 200, type: SkillResponseDto })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Patch('/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: SkillUpdateDto) {
    return this.skillService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a skill' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/:id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.skillService.delete(id);
  }
}
