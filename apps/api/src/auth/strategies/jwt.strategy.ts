import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigService } from '@nestjs/config';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../drizzle/drizzle.module.js';
import type * as schema from '../../drizzle/schema.js';
import { users } from '../../drizzle/schema.js';
import type { Env } from '../../config/env.schema.js';

export interface JwtPayload {
  sub: number;
  email: string;
  role: 'admin' | 'editor';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService) configService: ConfigService<Env, true>,
    @Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const result = await this.db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    const user = result[0];
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
