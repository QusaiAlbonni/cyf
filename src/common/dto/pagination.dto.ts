import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * DTO representing pagination meta information.
 */
@Expose()
export class PaginationMetaDto {
  @ApiProperty({ description: 'Total number of items in the collection.' })
  totalItems: number;

  @ApiProperty({ description: 'Current page number.' })
  currentPage: number;

  @ApiProperty({ description: 'Number of items per page.' })
  itemCount: number;

  @ApiProperty({ description: 'The limit.' })
  itemsPerPage: number;

  @ApiProperty({ description: 'Total number of pages.' })
  totalPages: number;
}

/**
 * DTO representing pagination links.
 */
@Expose()
export class PaginationLinksDto {
  @ApiProperty({ description: 'URL to the first page.' })
  first: string;

  @ApiProperty({ description: 'URL to the previous page.' })
  previous: string;

  @ApiProperty({ description: 'URL to the next page.' })
  next: string;

  @ApiProperty({ description: 'URL to the last page.' })
  last: string;
}

/**
 * Factory function to generate a paginated DTO for a given model.
 *
 * @param model - The class (constructor) of the model contained in the items array.
 * @returns A new class decorated for Swagger, showing a paginated response.
 */
export const PaginatedDto = <TModel>(model: Function) => {
  @ApiExtraModels(model)
  @Expose()
  class PaginatedDtoClass {
    @ApiProperty({
      description: 'A list of items to be returned.',
      type: 'array',
      items: { $ref: getSchemaPath(model) },
    })
    @Type(() => model)
    items: TModel[];

    @ApiProperty({
      description: 'Associated meta information (e.g., counts).',
      type: PaginationMetaDto,
    })
    @Type(() => PaginationMetaDto)
    meta: PaginationMetaDto;

    @ApiProperty({
      description: 'Associated links for pagination.',
      type: PaginationLinksDto,
      required: false,
    })
    @Type(() => PaginationLinksDto)
    links?: PaginationLinksDto;
  }

  Object.defineProperty(PaginatedDtoClass, 'name', {
    value: `Paginated${model.name}`,
    writable: false,
  });

  return PaginatedDtoClass;
};
