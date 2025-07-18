import { Repository, FindOptionsWhere, FindManyOptions, FindOptionsOrder } from 'typeorm';
import { PaginatedResponse } from '../interfaces/api-response.interface';
import { PaginationDto, PaginationWithSortDto } from '../../dto/pagination.dto';

export abstract class BaseRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  async create(entity: Partial<T>): Promise<T> {
    const newEntity = this.repository.create(entity as any);
    const saved = await this.repository.save(newEntity);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findById(id: string): Promise<T | null> {
    return await this.repository.findOne({ where: { id } as unknown as FindOptionsWhere<T> });
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return await this.repository.find(options);
  }

  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    options?: FindManyOptions<T>,
  ): Promise<PaginatedResponse<T>> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.repository.findAndCount({
      ...options,
      skip,
      take: limit,
    });

    const pages = Math.ceil(total / limit);

    return {
      success: true,
      message: 'Data retrieved successfully',
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  async findWithPaginationAndSort(
    paginationDto: PaginationDto,
    options?: FindManyOptions<T>,
    sortDto?: { sortBy?: string; sortOrder?: 'ASC' | 'DESC' },
  ): Promise<PaginatedResponse<T>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Build order options
    let order: FindOptionsOrder<T> = {};
    if (sortDto?.sortBy) {
      order = {
        [sortDto.sortBy]: sortDto.sortOrder || 'DESC',
      } as FindOptionsOrder<T>;
    }

    const [data, total] = await this.repository.findAndCount({
      ...options,
      order,
      skip,
      take: limit,
    });

    const pages = Math.ceil(total / limit);

    return {
      success: true,
      message: 'Data retrieved successfully',
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  async update(id: string, updateData: Partial<T>): Promise<T | null> {
    await this.repository.update(id, updateData as any);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }

  async findOne(options: FindManyOptions<T>): Promise<T | null> {
    return await this.repository.findOne(options);
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return await this.repository.count(options);
  }
} 