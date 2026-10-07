import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

interface AuthenticatedUser {
  sub: string;
  [key: string]: unknown;
}

interface AuthCookies {
  cc_access_token?: string;
}

export interface OptionalAuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  cookies: AuthCookies;
}

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  private readonly verifier: ReturnType<typeof CognitoJwtVerifier.create>;

  constructor(private readonly configService: ConfigService) {
    this.verifier = CognitoJwtVerifier.create({
      userPoolId: this.configService.getOrThrow<string>('COGNITO_USER_POOL_ID'),
      tokenUse: 'access',
      clientId: this.configService.getOrThrow<string>('COGNITO_CLIENT_ID'),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<OptionalAuthenticatedRequest>();

    const cookieToken = request.cookies.cc_access_token;

    const authorization = request.headers.authorization;

    const headerToken = authorization?.replace(/^Bearer\s+/i, '').trim();

    const token: string | undefined = cookieToken || headerToken;

    if (!token) {
      return true;
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
