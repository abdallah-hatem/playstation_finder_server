import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Max, Min, IsString } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class SortDto {
  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
  })
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    example: 'DESC',
  })
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class PaginationWithSortDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
  })
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    example: 'DESC',
  })
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class PaginationWithSortAndSearchDto extends PaginationWithSortDto {
  @ApiPropertyOptional({
    description: 'Search query to filter results across multiple fields (user name, room name, shop name, address, phone, etc.)',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;
} 