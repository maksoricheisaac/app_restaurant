import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';

// Mapping codes d'erreur Prisma → HTTP sémantique
const PRISMA_ERROR_MAP: Record<
  string,
  { status: number; message: string; code: string }
> = {
  P2002: {
    status: 409,
    message: 'Cette ressource existe déjà (doublon).',
    code: 'CONFLICT',
  },
  P2025: { status: 404, message: 'Ressource introuvable.', code: 'NOT_FOUND' },
  P2003: {
    status: 400,
    message: 'Référence invalide vers une ressource liée.',
    code: 'FOREIGN_KEY_VIOLATION',
  },
  P2014: {
    status: 400,
    message: 'Violation de contrainte de relation.',
    code: 'RELATION_VIOLATION',
  },
  P2016: {
    status: 400,
    message: "Erreur d'interprétation de la requête.",
    code: 'QUERY_ERROR',
  },
  P2022: { status: 400, message: 'Colonne inconnue.', code: 'UNKNOWN_COLUMN' },
  P2034: {
    status: 409,
    message: 'Conflit de transaction — réessayez.',
    code: 'TRANSACTION_CONFLICT',
  },
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as any).requestId as string | undefined;

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
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
      // Only capture server errors — 4xx are expected user/auth errors, not bugs.
      if (status >= 500) {
        this.captureToSentry(exception, request, requestId);
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Erreurs Prisma connues → codes HTTP sémantiques
      const mapped = PRISMA_ERROR_MAP[exception.code];
      if (mapped) {
        status = mapped.status;
        message = mapped.message;
        code = mapped.code;
        // Log uniquement en debug — les erreurs Prisma connues ne sont pas des bugs
        this.logger.debug(
          JSON.stringify({
            event: 'prisma_known_error',
            requestId,
            prismaCode: exception.code,
            path: request.url,
          }),
        );
        // P2034 (transaction conflict) is a 409 — still a server-side issue worth tracking.
        if (mapped.status >= 500) {
          this.captureToSentry(exception, request, requestId);
        }
      } else {
        // Unknown Prisma code — treat as 500 and capture.
        this.logUnhandledError(exception, request, requestId);
        this.captureToSentry(exception, request, requestId);
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = 400;
      message = "Données invalides pour l'opération demandée.";
      code = 'VALIDATION_ERROR';
      this.logger.debug(
        JSON.stringify({
          event: 'prisma_validation_error',
          requestId,
          path: request.url,
        }),
      );
    } else if (exception instanceof Error) {
      this.logUnhandledError(exception, request, requestId);
      this.captureToSentry(exception, request, requestId);
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

  private captureToSentry(
    error: unknown,
    request: Request,
    requestId?: string,
  ): void {
    if (!Sentry.isEnabled()) return;

    const user = (request as any).user;
    Sentry.withScope((scope) => {
      if (requestId) scope.setTag('requestId', requestId);
      scope.setTag('path', request.url);
      scope.setTag('method', request.method);
      if (user?.id) scope.setUser({ id: user.id, email: user.email });
      Sentry.captureException(error);
    });
  }

  private logUnhandledError(
    error: Error,
    request: Request,
    requestId?: string,
  ) {
    this.logger.error(
      JSON.stringify({
        event: 'unhandled_error',
        requestId,
        method: request.method,
        path: request.url,
        userId: (request as any).user?.id ?? null,
        error: error.message,
        stack: this.isProduction ? undefined : error.stack,
      }),
    );
  }
}
