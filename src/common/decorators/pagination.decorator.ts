import { applyDecorators } from '@nestjs/common';
import { ApiQuery, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { PaginationDto, PaginationWithSortDto, PaginationWithSortAndSearchDto } from '../../dto/pagination.dto';
import { ReservationStatus } from '../enums/reservation-type.enum';

export function ApiPagination() {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (default: 10, max: 100)',
      example: 10,
    }),
  );
}

export function ApiPaginationWithSort() {
  return applyDecorators(
    ApiPagination(),
    ApiQuery({
      name: 'sortBy',
      required: false,
      type: String,
      description: 'Field to sort by',
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['ASC', 'DESC'],
      description: 'Sort order (default: DESC)',
      example: 'DESC',
    }),
  );
}

export function ApiPaginationWithSortAndSearch() {
  return applyDecorators(
    ApiPaginationWithSort(),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search query to filter results across multiple fields (user name, room name, shop name, address, phone, etc.)',
      example: 'john',
    }),
  );
}

export function ApiReservationFilter() {
  return applyDecorators(
    ApiPaginationWithSortAndSearch(),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ReservationStatus,
      description: 'Filter by reservation status',
      example: ReservationStatus.PENDING,
    }),
  );
}

export function ApiPaginatedResponse(model: any) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiExtraModels(PaginationDto),
    // This creates a response schema that shows the paginated structure
  );
} 