import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

import { ACCESS_TOKEN_COOKIE } from '../auth.cookies';

export interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    [key: string]: unknown;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly verifier: ReturnType<typeof CognitoJwtVerifier.create>;

  constructor(private readonly configService: ConfigService) {
    this.verifier = CognitoJwtVerifier.create({
      userPoolId: this.configService.getOrThrow<string>('COGNITO_USER_POOL_ID'),
      tokenUse: 'access',
      clientId: this.configService.getOrThrow<string>('COGNITO_CLIENT_ID'),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const cookies = request.cookies as Record<string, string> | undefined;

    const cookieToken = cookies?.[ACCESS_TOKEN_COOKIE];

    const authorization = request.headers.authorization;

    const bearerToken = authorization?.replace(/^Bearer\s+/i, '').trim();

    const token: string | undefined = cookieToken || bearerToken;

    if (!token) {
      throw new UnauthorizedException('Access token is required.');
    }

    try {
      const payload = await this.verifier.verify(token);

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }
}
