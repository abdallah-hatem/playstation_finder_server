import { FindManyOptions } from 'typeorm';
import { PaginationDto, PaginationWithSortDto } from '../../dto/pagination.dto';

/**
 * Helper to quickly add pagination to any service method
 * 
 * Example usage in service:
 * 
 * ```typescript
 * async findAllPaginated(paginationDto: PaginationDto): Promise<PaginatedResponse<Entity>> {
 *   return await this.repository.findWithPagination(
 *     paginationDto.page,
 *     paginationDto.limit,
 *     { relations: ['related_entity'] } // optional TypeORM options
 *   );
 * }
 * ```
 */
export class PaginationHelper {
  /**
   * Creates standardized TypeORM options for pagination with sorting
   */
  static createPaginationOptions<T>(
    paginationDto: PaginationWithSortDto,
    baseOptions?: FindManyOptions<T>
  ): FindManyOptions<T> {
    const { page = 1, limit = 10, sortBy, sortOrder = 'DESC' } = paginationDto;
    const skip = (page - 1) * limit;

    let order = {};
    if (sortBy) {
      order = { [sortBy]: sortOrder };
    }

    return {
      ...baseOptions,
      skip,
      take: limit,
      order: { ...baseOptions?.order, ...order },
    };
  }

  /**
   * Standard pagination constants
   */
  static readonly DEFAULT_PAGE = 1;
  static readonly DEFAULT_LIMIT = 10;
  static readonly MAX_LIMIT = 100;
}

/**
 * How to implement pagination in your controllers:
 * 
 * 1. Import the pagination DTOs and decorators:
 * ```typescript
 * import { PaginationDto, PaginationWithSortDto } from '../dto/pagination.dto';
 * import { ApiPagination, ApiPaginationWithSort } from '../common/decorators/pagination.decorator';
 * ```
 * 
 * 2. Add pagination endpoints:
 * ```typescript
 * @Get('paginated')
 * @ApiOperation({ summary: 'Get all items with pagination' })
 * @ApiPagination()
 * @ApiResponseSuccess({ message: 'Items retrieved successfully' })
 * findAllPaginated(@Query() paginationDto: PaginationDto) {
 *   return this.service.findAllPaginated(paginationDto);
 * }
 * 
 * @Get('paginated-sorted')
 * @ApiOperation({ summary: 'Get all items with pagination and sorting' })
 * @ApiPaginationWithSort()
 * @ApiResponseSuccess({ message: 'Items retrieved successfully' })
 * findAllPaginatedWithSort(@Query() paginationWithSortDto: PaginationWithSortDto) {
 *   return this.service.findAllPaginatedWithSort(paginationWithSortDto);
 * }
 * ```
 * 
 * 3. In your service, extend your repository methods:
 * ```typescript
 * async findAllPaginated(paginationDto: PaginationDto): Promise<PaginatedResponse<Entity>> {
 *   return await this.repository.findWithPagination(
 *     paginationDto.page,
 *     paginationDto.limit,
 *     { relations: ['relatedEntity'] } // optional relations or other TypeORM options
 *   );
 * }
 * ```
 * 
 * 4. For custom queries with pagination:
 * ```typescript
 * async findCustomPaginated(
 *   filters: any, 
 *   paginationDto: PaginationDto
 * ): Promise<PaginatedResponse<Entity>> {
 *   const queryBuilder = this.repository.repository.createQueryBuilder('entity');
 *   
 *   // Add your custom filters
 *   if (filters.name) {
 *     queryBuilder.andWhere('entity.name ILIKE :name', { name: `%${filters.name}%` });
 *   }
 *   
 *   // Apply pagination
 *   const skip = (paginationDto.page - 1) * paginationDto.limit;
 *   queryBuilder.skip(skip).take(paginationDto.limit);
 *   
 *   const [data, total] = await queryBuilder.getManyAndCount();
 *   const pages = Math.ceil(total / paginationDto.limit);
 *   
 *   return {
 *     success: true,
 *     message: 'Data retrieved successfully',
 *     data,
 *     pagination: {
 *       page: paginationDto.page,
 *       limit: paginationDto.limit,
 *       total,
 *       pages,
 *     },
 *     statusCode: 200,
 *     timestamp: new Date().toISOString(),
 *   };
 * }
 * ```
 */ 