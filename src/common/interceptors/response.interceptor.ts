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

  private removePasswordHash(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removePasswordHash(item));
    }

    // Handle Date objects specially - don't spread them
    if (obj instanceof Date) {
      return obj;
    }

    if (typeof obj === 'object') {
      const cleaned = { ...obj };
      
      // Remove passwordHash if it exists
      if ('passwordHash' in cleaned) {
        delete cleaned.passwordHash;
      }

      // Recursively clean nested objects
      for (const key in cleaned) {
        if (cleaned.hasOwnProperty(key)) {
          cleaned[key] = this.removePasswordHash(cleaned[key]);
        }
      }

      return cleaned;
    }

    return obj;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();
    const options = this.reflector.get<ApiResponseOptions>(
      API_RESPONSE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => {
        // Remove passwordHash from response data
        const cleanedData = this.removePasswordHash(data);

        // Check if data is already wrapped (has success, message, etc.)
        if (cleanedData && typeof cleanedData === 'object' && 'success' in cleanedData && 'message' in cleanedData) {
          return cleanedData as ApiResponse<T>;
        }
        
        // If not wrapped, wrap it
        return {
          success: true,
          message: options?.message || 'Operation successful',
          data: cleanedData,
          statusCode: response.statusCode,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
} 