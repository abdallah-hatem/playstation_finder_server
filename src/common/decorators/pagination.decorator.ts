import { applyDecorators } from '@nestjs/common';
import { ApiQuery, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { PaginationDto, PaginationWithSortDto } from '../../dto/pagination.dto';

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

export function ApiPaginatedResponse(model: any) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiExtraModels(PaginationDto),
    // This creates a response schema that shows the paginated structure
  );
} 