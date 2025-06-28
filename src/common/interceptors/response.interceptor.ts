import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ApiResponse } from '../interfaces/api-response.interface';
import { API_RESPONSE_KEY, ApiResponseOptions } from '../decorators/api-response.decorator';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();
    const options = this.reflector.get<ApiResponseOptions>(
      API_RESPONSE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => {
        // Check if data is already wrapped (has success, message, etc.)
        if (data && typeof data === 'object' && 'success' in data && 'message' in data) {
          return data as ApiResponse<T>;
        }
        
        // If not wrapped, wrap it
        return {
          success: true,
          message: options?.message || 'Operation successful',
          data,
          statusCode: response.statusCode,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
} 