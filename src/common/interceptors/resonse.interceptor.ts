import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import {
  Injectable,
  HttpException,
  HttpStatus,
  UnprocessableEntityException,
  //   Inject,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import type { ApiResponse } from './response.interface';
import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  private readonly logger = new Logger(ResponseInterceptor.name);
  constructor() {}
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    // @ts-expect-error ts(2349)
    return next.handle().pipe(
      map((response) => {
        // Return response as it is i.e sendFile response
        if (!response) return;

        const { message, data } = response;
        // Invalidate cache for write operations
        // if (['PUT', 'POST', 'PATCH', 'DELETE'].includes(request.method)) {
        //   const cacheKey = generateCacheKey(request);
        //   this.cacheManager.del(cacheKey);
        // }

        return this.formatSuccessResponse(
          statusCode,
          request.url,
          message,
          data,
        );
      }),
      catchError((err) => this.handleError(err, request.url)),
    );
  }

  private formatSuccessResponse(
    statusCode: number,
    path: string,
    message: string,
    data: T | T[],
  ): ApiResponse<T> {
    // if (data instanceof PaginationResponseDto) {
    //   return {
    //     statusCode,
    //     success: true,
    //     message,
    //     data: data.data,
    //     metadata: {
    //       total: data.total,
    //       timestamp: Date.now(),
    //       requestId: randomUUID(),
    //       version: 'v1',
    //     },
    //   };
    // }
    return {
      statusCode,
      success: true,
      message,
      data,
      metadata: {
        timestamp: Date.now(),
        requestId: randomUUID(),
        version: 'v1',
      },
    };
  }
  private handleError(err: any, path: string): Observable<never> {
    const statusCode =
      err instanceof HttpException
        ? err.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error({
      message: 'Error occurred',
      path,
      statusCode,
      errors: err.message,
      stack: err.stack,
    });

    let errorResponse: ApiResponse<null> = {
      statusCode,
      success: false,
      errors: err.name || 'Error occurred',
      message: err.response.message || err.message || 'Internal server error',
      data: null,
      metadata: {
        timestamp: Date.now(),
        requestId: randomUUID(),
        version: 'v1',
      },
    };

    if (err instanceof UnprocessableEntityException) {
      const validationResponse = err.getResponse() as any;

      const errors =
        validationResponse.message ??
        validationResponse.errors ??
        validationResponse ??
        [];

      errorResponse = {
        ...errorResponse,
        message: 'Validation failed',
        errors,
      };
    }

    return throwError(() => new HttpException(errorResponse, statusCode));
  }

  private getStatusMessage(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return 'Success';
    if (statusCode >= 400 && statusCode < 500) return 'Client Error';
    if (statusCode >= 500) return 'Server Error';
    return 'Unknown Status';
  }
}
