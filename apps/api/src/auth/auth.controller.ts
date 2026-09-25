import { Controller, Post, Get, Body, Req, Res, UseGuards, UnauthorizedException, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service.js';
import { loginDtoSchema, type LoginDto } from './dto/login.dto.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { User } from '../drizzle/schema.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({ summary: 'Admin/editor login with email and password' })
  async login(
    @Body(new ZodValidationPipe(loginDtoSchema)) body: LoginDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const user = await this.authService.validateUser(body.email, body.password);
    const { accessToken, refreshToken, user: safeUser } = await this.authService.login(user);

    res.setCookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return {
      ok: true,
      data: {
        accessToken,
        user: safeUser,
      },
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh cookie or body token' })
  async refresh(
    @Req() req: FastifyRequest,
    @Body() body: { refreshToken?: string },
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const cookies = req.cookies as Record<string, string | undefined>;
    const token = cookies?.['refresh_token'] || body?.refreshToken;

    if (!token) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const { accessToken, refreshToken, user } = await this.authService.refresh(token);

    res.setCookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60,
    });

    return {
      ok: true,
      data: {
        accessToken,
        user,
      },
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out and clear refresh token cookie' })
  async logout(@Res({ passthrough: true }) res: FastifyReply) {
    res.clearCookie('refresh_token', {
      path: '/api/v1/auth',
    });

    return {
      ok: true,
      data: { message: 'Logged out successfully' },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user info' })
  async me(@CurrentUser() user: Omit<User, 'passwordHash'>) {
    return {
      ok: true,
      data: user,
    };
  }
}
