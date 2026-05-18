import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as any).requestId as string | undefined;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Une erreur interne est survenue';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj.message as string | string[]) ?? message;
        code = (resObj.error as string) ?? code;
      }
    } else if (exception instanceof Error) {
      // Structured JSON log for unhandled errors — searchable in log aggregators.
      this.logger.error(
        JSON.stringify({
          event: 'unhandled_error',
          requestId,
          method: request.method,
          path: request.url,
          userId: (request as any).user?.id ?? null,
          tenantId: request.headers['x-tenant-id'] ?? null,
          error: exception.message,
          stack: this.isProduction ? undefined : exception.stack,
        }),
      );
    }

    response.status(status).json({
      statusCode: status,
      code,
      message: Array.isArray(message) ? message.join(', ') : message,
      requestId,
      timestamp: new Date().toISOString(),
      ...(this.isProduction ? {} : { path: request.url }),
    });
  }
}
