import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterDto } from './dto/register.dto';

import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  GetUserCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
  SignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ChangePasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { createHmac } from 'crypto';

import { DbService } from '../db/db.service';
import { users } from '../db/schema';

@Injectable()
export class AuthService {
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly userPoolId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly dbService: DbService,
  ) {
    const region = this.configService.getOrThrow<string>('AWS_REGION');

    this.userPoolId = this.configService.getOrThrow<string>(
      'COGNITO_USER_POOL_ID',
    );

    this.clientId = this.configService.getOrThrow<string>('COGNITO_CLIENT_ID');

    this.clientSecret = this.configService.getOrThrow<string>(
      'COGNITO_CLIENT_SECRET',
    );

    this.cognitoClient = new CognitoIdentityProviderClient({
      region,
    });
  }

  async register(registerDto: RegisterDto) {
    const secretHash = this.generateSecretHash(registerDto.email);

    const command = new SignUpCommand({
      ClientId: this.clientId,
      Username: registerDto.email,
      Password: registerDto.password,
      SecretHash: secretHash,
      UserAttributes: [
        {
          Name: 'email',
          Value: registerDto.email,
        },
      ],
    });

    const result = await this.cognitoClient.send(command);

    await this.dbService.db.insert(users).values({
      id: result.UserSub!,
      firstName: registerDto.firstName,
      middleName: registerDto.middleName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      role: 'student',
      status: 'pending',
      joinedAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      userSub: result.UserSub,
      userConfirmed: result.UserConfirmed,
    };
  }

  async confirmEmail(confirmEmailDto: ConfirmEmailDto) {
    const secretHash = this.generateSecretHash(confirmEmailDto.email);

    await this.cognitoClient.send(
      new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: confirmEmailDto.email,
        ConfirmationCode: confirmEmailDto.code,
        SecretHash: secretHash,
      }),
    );

    await this.dbService.db
      .update(users)
      .set({
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(users.email, confirmEmailDto.email));

    return {
      message: 'Email confirmed successfully.',
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, loginDto.email))
      .limit(1);

    if (!user[0]) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'No account found with this email.',
      });
    }

    if (user[0].status === 'pending') {
      throw new UnauthorizedException({
        statusCode: 401,
        status: 'pending',
        message: 'Please verify your email before logging in.',
      });
    }

    if (user[0].status === 'inactive') {
      throw new UnauthorizedException({
        statusCode: 401,
        status: 'inactive',
        message: 'Account is not active.',
      });
    }

    const secretHash = this.generateSecretHash(loginDto.email);

    const result = await this.cognitoClient.send(
      new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: loginDto.email,
          PASSWORD: loginDto.password,
          SECRET_HASH: secretHash,
        },
      }),
    );

    return {
      accessToken: result.AuthenticationResult?.AccessToken,
      idToken: result.AuthenticationResult?.IdToken,
      refreshToken: result.AuthenticationResult?.RefreshToken,
      expiresIn: result.AuthenticationResult?.ExpiresIn,
      tokenType: result.AuthenticationResult?.TokenType,
    };
  }

  async getMe(accessToken: string) {
    const result = await this.cognitoClient.send(
      new GetUserCommand({
        AccessToken: accessToken,
      }),
    );

    const sub = result.UserAttributes?.find(
      (attribute) => attribute.Name === 'sub',
    )?.Value;

    const emailVerified =
      result.UserAttributes?.find(
        (attribute) => attribute.Name === 'email_verified',
      )?.Value === 'true';

    if (!sub) {
      throw new UnauthorizedException('Invalid user.');
    }

    const user = await this.dbService.db
      .select({
        id: users.id,
        firstName: users.firstName,
        middleName: users.middleName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        status: users.status,
        profilePhotoUrl: users.profilePhotoUrl,
        joinedAt: users.joinedAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, sub))
      .limit(1);

    if (!user[0]) {
      throw new UnauthorizedException('User not found.');
    }

    return {
      ...user[0],
      emailVerified,
    };
  }

  async logout(accessToken: string) {
    await this.cognitoClient.send(
      new GlobalSignOutCommand({
        AccessToken: accessToken,
      }),
    );

    return {
      message: 'Logged out successfully.',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const secretHash = this.generateSecretHash(forgotPasswordDto.email);

    await this.cognitoClient.send(
      new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: forgotPasswordDto.email,
        SecretHash: secretHash,
      }),
    );

    return {
      message: 'Password reset code sent successfully.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const secretHash = this.generateSecretHash(resetPasswordDto.email);

    await this.cognitoClient.send(
      new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        Username: resetPasswordDto.email,
        ConfirmationCode: resetPasswordDto.code,
        Password: resetPasswordDto.newPassword,
        SecretHash: secretHash,
      }),
    );

    return {
      message: 'Password reset successfully.',
    };
  }

  async refreshToken(refreshToken: string, email: string) {
    const user = await this.dbService.db
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user[0]) {
      throw new UnauthorizedException('User not found.');
    }

    const secretHash = this.generateSecretHash(user[0].id);

    const result = await this.cognitoClient.send(
      new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
          SECRET_HASH: secretHash,
        },
      }),
    );

    return {
      accessToken: result.AuthenticationResult?.AccessToken,
      idToken: result.AuthenticationResult?.IdToken,
      expiresIn: result.AuthenticationResult?.ExpiresIn,
      tokenType: result.AuthenticationResult?.TokenType,
    };
  }

  async changePassword(
    accessToken: string,
    oldPassword: string,
    newPassword: string,
  ) {
    await this.cognitoClient.send(
      new ChangePasswordCommand({
        AccessToken: accessToken,
        PreviousPassword: oldPassword,
        ProposedPassword: newPassword,
      }),
    );

    return {
      message: 'Password changed successfully.',
    };
  }

  private generateSecretHash(username: string): string {
    return createHmac('sha256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }
}
