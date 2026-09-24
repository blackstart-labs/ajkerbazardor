import { Catch, HttpException, HttpStatus, Logger, type ExceptionFilter, type ArgumentsHost } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ZodError } from 'zod';

interface ErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let response: ErrorResponse;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const inner = exception.getResponse();
      const message =
        typeof inner === 'string' ? inner : ((inner as { message?: string }).message ?? exception.message);
      response = {
        ok: false,
        error: { code: `HTTP_${status}`, message },
      };
    } else if (exception instanceof ZodError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      response = {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: exception.flatten(),
        },
      };
    } else {
      // Unexpected — log full error, return generic message
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
      response = {
        ok: false,
        error: { code: 'INTERNAL_ERROR', message: 'কিছু একটা গড়বড় হয়েছে। আবার চেষ্টা করুন।' },
      };
    }

    reply.status(status).send(response);
  }
}
