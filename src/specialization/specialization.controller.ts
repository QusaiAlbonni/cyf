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
import {
  SpecializationCreateDto,
  SpecializationQueryDto,
  SpecializationResponseDto,
  SpecializationUpdateDto,
} from './dto';
import { SpecializationService } from './specialization.service';

@ApiBearerAuth('Bearer')
@UseGuards(OpaqueAuthGuard)
@Controller('specializations')
export class SpecializationController {
  constructor(private readonly specializationService: SpecializationService) {}

  @ApiOperation({ summary: 'Create a specialization' })
  @ApiResponse({ status: 201, type: SpecializationResponseDto })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() dto: SpecializationCreateDto) {
    return this.specializationService.create(dto);
  }

  @ApiOperation({ summary: 'List specializations' })
  @ApiQuery({ type: SpecializationQueryDto })
  @ApiResponse({
    status: 200,
    type: PaginatedDto<SpecializationResponseDto>(SpecializationResponseDto),
  })
  @Get()
  getAll(@Query() query: SpecializationQueryDto, @FullUrl() url: string) {
    return this.specializationService.getAll(query, url);
  }

  @ApiOperation({ summary: 'Get a specialization' })
  @ApiResponse({ status: 200, type: SpecializationResponseDto })
  @Get('/:id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.specializationService.getOne(id);
  }

  @ApiOperation({ summary: 'Update a specialization' })
  @ApiResponse({ status: 200, type: SpecializationResponseDto })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Patch('/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SpecializationUpdateDto,
  ) {
    return this.specializationService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a specialization' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/:id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.specializationService.delete(id);
  }
}
