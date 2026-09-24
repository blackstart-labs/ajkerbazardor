import { Test, type TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AuthService } from '../src/auth/auth.service.js';
import { DRIZZLE } from '../src/drizzle/drizzle.module.js';
import * as schema from '../src/drizzle/schema.js';

describe('AuthService', () => {
  let service: AuthService;
  const dbFile = path.join(__dirname, 'test-auth.db');
  let client: ReturnType<typeof createClient>;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
    client = createClient({ url: `file:${dbFile}` });
    db = drizzle(client, { schema });

    // Apply migrations
    const migrationsDir = path.join(__dirname, '../drizzle/migrations');
    for (const file of ['0001_initial.sql', '0002_seed.sql']) {
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      const stripped = sqlContent
        .split('\n')
        .map((l) => {
          const idx = l.indexOf('--');
          return idx >= 0 ? l.slice(0, idx) : l;
        })
        .join('\n');
      const stmts = stripped
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      for (const stmt of stmts) {
        await client.execute(stmt);
      }
    }

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              JWT_SECRET: 'test-secret-at-least-32-chars-long-here',
              JWT_EXPIRES_IN: '15m',
              JWT_REFRESH_EXPIRES_IN: '7d',
              ADMIN_EMAIL: 'admin@test.com',
              ADMIN_PASSWORD: 'admin-password-1234',
            }),
          ],
        }),
        JwtModule.register({
          secret: 'test-secret-at-least-32-chars-long-here',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      providers: [
        AuthService,
        {
          provide: DRIZZLE,
          useValue: db,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    client.close();
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
  });

  it('seeds admin user if table is empty', async () => {
    await service.seedAdminIfEmpty();
    const allUsers = await db.select().from(schema.users);
    expect(allUsers.length).toBe(1);
    expect(allUsers[0]?.email).toBe('admin@test.com');
    expect(allUsers[0]?.role).toBe('admin');
  });

  it('validates correct user credentials', async () => {
    const user = await service.validateUser('admin@test.com', 'admin-password-1234');
    expect(user).toBeDefined();
    expect(user.email).toBe('admin@test.com');
    expect('passwordHash' in user).toBe(false);
  });

  it('rejects invalid password', async () => {
    await expect(service.validateUser('admin@test.com', 'wrong-password')).rejects.toThrow(UnauthorizedException);
  });

  it('rejects non-existent email', async () => {
    await expect(service.validateUser('ghost@test.com', 'some-pass')).rejects.toThrow(UnauthorizedException);
  });

  it('logs in and returns access and refresh tokens', async () => {
    const user = await service.validateUser('admin@test.com', 'admin-password-1234');
    const result = await service.login(user);

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe('admin@test.com');
  });

  it('refreshes token successfully', async () => {
    const user = await service.validateUser('admin@test.com', 'admin-password-1234');
    const { refreshToken } = await service.login(user);

    const refreshed = await service.refresh(refreshToken);
    expect(refreshed.accessToken).toBeDefined();
    expect(refreshed.refreshToken).toBeDefined();
    expect(refreshed.user.email).toBe('admin@test.com');
  });

  it('rejects invalid refresh token', async () => {
    await expect(service.refresh('invalid-bogus-token')).rejects.toThrow(UnauthorizedException);
  });
});
