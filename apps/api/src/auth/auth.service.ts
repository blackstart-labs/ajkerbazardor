import { Injectable, Inject, UnauthorizedException, Logger, type OnApplicationBootstrap } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { JwtService } from '@nestjs/jwt';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { ConfigService } from '@nestjs/config';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as argon2 from 'argon2';
import { eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import type * as schema from '../drizzle/schema.js';
import { users, type User } from '../drizzle/schema.js';
import type { Env } from '../config/env.schema.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdminIfEmpty();
  }

  async seedAdminIfEmpty(): Promise<void> {
    try {
      const countResult = await this.db.select({ count: sql<number>`count(*)` }).from(users);
      const count = Number(countResult[0]?.count ?? 0);

      if (count === 0) {
        const email = this.configService.get('ADMIN_EMAIL');
        const password = this.configService.get('ADMIN_PASSWORD');
        const passwordHash = await argon2.hash(password);

        await this.db.insert(users).values({
          email,
          passwordHash,
          role: 'admin',
        });

        this.logger.warn(`Seeded initial admin user: ${email}`);
      }
    } catch (err) {
      this.logger.warn(
        `Could not seed initial admin user (migrations may not have run): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async validateUser(email: string, pass: string): Promise<Omit<User, 'passwordHash'>> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = result[0];

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.passwordHash, pass);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { id: user.id, email: user.email, role: user.role };
  }

  async login(user: Omit<User, 'passwordHash'>) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken);
      const result = await this.db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
      const user = result[0];

      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      const newPayload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
      const newAccessToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: this.configService.get('JWT_EXPIRES_IN'),
      });
      const newRefreshToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: { id: user.id, email: user.email, role: user.role },
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
