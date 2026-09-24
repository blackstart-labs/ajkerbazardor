import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { FastifyReply, FastifyRequest } from 'fastify';
import * as crypto from 'node:crypto';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CachePurgerService } from './cache-purger.service.js';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(private readonly purger: CachePurgerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const reply = http.getResponse<FastifyReply>();

    return next.handle().pipe(
      map((data) => {
        if (request.method !== 'GET') {
          return data;
        }

        const serialized = JSON.stringify(data);
        const version = this.purger.getVersion();
        const hash = crypto.createHash('md5').update(`${version}:${serialized}`).digest('hex');
        const etag = `W/"${hash}"`;

        reply.header('ETag', etag);
        reply.header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');

        const clientEtag = request.headers['if-none-match'];
        if (clientEtag && clientEtag === etag) {
          reply.status(304).send();
          return;
        }

        return data;
      }),
    );
  }
}
