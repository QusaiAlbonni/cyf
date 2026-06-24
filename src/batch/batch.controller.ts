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
import { BatchService } from './batch.service';
import {
  BatchCreateDto,
  BatchQueryDto,
  BatchResponseDto,
  BatchUpdateDto,
} from './dto';

@ApiBearerAuth('Bearer')
@UseGuards(OpaqueAuthGuard)
@Controller('batches')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @ApiOperation({ summary: 'Create a batch' })
  @ApiResponse({ status: 201, type: BatchResponseDto })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() dto: BatchCreateDto) {
    return this.batchService.create(dto);
  }

  @ApiOperation({ summary: 'List batches' })
  @ApiQuery({ type: BatchQueryDto })
  @ApiResponse({
    status: 200,
    type: PaginatedDto<BatchResponseDto>(BatchResponseDto),
  })
  @Get()
  getAll(@Query() query: BatchQueryDto, @FullUrl() url: string) {
    return this.batchService.getAll(query, url);
  }

  @ApiOperation({ summary: 'Get a batch' })
  @ApiResponse({ status: 200, type: BatchResponseDto })
  @Get('/:id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.batchService.getOne(id);
  }

  @ApiOperation({ summary: 'Update a batch' })
  @ApiResponse({ status: 200, type: BatchResponseDto })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Patch('/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: BatchUpdateDto) {
    return this.batchService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a batch' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/:id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.batchService.delete(id);
  }
}
