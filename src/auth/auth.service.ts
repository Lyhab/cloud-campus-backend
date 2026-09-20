import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  GetUserCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
  SignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { createHmac } from 'crypto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly userPoolId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private readonly configService: ConfigService) {
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

    return {
      message: 'Email confirmed successfully.',
    };
  }

  async login(loginDto: LoginDto) {
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

    const email = result.UserAttributes?.find(
      (attribute) => attribute.Name === 'email',
    )?.Value;

    const emailVerified =
      result.UserAttributes?.find(
        (attribute) => attribute.Name === 'email_verified',
      )?.Value === 'true';

    return {
      username: result.Username,
      sub,
      email,
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

  private generateSecretHash(username: string): string {
    return createHmac('sha256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }
}
