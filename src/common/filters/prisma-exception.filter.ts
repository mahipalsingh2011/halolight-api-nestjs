import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/**
 * Global exception filter for Prisma errors
 * Maps Prisma-specific errors to appropriate HTTP responses
 */
@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientValidationError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, error } = this.mapException(exception);

    // Log error with context
    this.logger.warn({
      message: 'Prisma error occurred',
      error: exception.name,
      code: 'code' in exception ? exception.code : 'VALIDATION_ERROR',
      path: request.url,
      timestamp: new Date().toISOString(),
    });

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private mapException(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientValidationError,
  ): {
    status: HttpStatus;
    message: string;
    error: string;
  } {
    // Handle validation errors
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid data provided',
        error: 'Bad Request',
      };
    }

    // Handle known request errors by error code
    const code = exception.code;
    switch (code) {
      case 'P2002': {
        // Unique constraint violation
        const target = exception.meta?.target as string[] | undefined;
        const field = target?.[0] || 'field';
        return {
          status: HttpStatus.CONFLICT,
          message: `A record with this ${field} already exists`,
          error: 'Conflict',
        };
      }

      case 'P2003':
        // Foreign key constraint violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid reference to related record',
          error: 'Bad Request',
        };

      case 'P2025':
        // Record not found
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error: 'Not Found',
        };

      case 'P2014':
        // Invalid relation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid relation constraint',
          error: 'Bad Request',
        };

      case 'P2000':
        // Value too long
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Value is too long for the field',
          error: 'Bad Request',
        };

      default:
        // Unknown Prisma error
        this.logger.error({
          message: 'Unhandled Prisma error code',
          code,
          details: exception.message,
        });
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected database error occurred',
          error: 'Internal Server Error',
        };
    }
  }
}
