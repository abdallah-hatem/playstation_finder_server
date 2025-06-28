import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const API_RESPONSE_KEY = 'api_response';

export interface ApiResponseOptions {
  message?: string;
  statusCode?: number;
}

export const ApiResponseSuccess = (options?: ApiResponseOptions) =>
  applyDecorators(
    SetMetadata(API_RESPONSE_KEY, options),
    ApiResponse({
      status: options?.statusCode || 200,
      description: options?.message || 'Success',
    }),
  ); 