import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { count, eq, sql } from 'drizzle-orm';
import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  GetUserCommand,
  GlobalSignOutCommand,
  InitiateAuthCommand,
  SignUpCommand,
  ChangePasswordCommand,
  ResendConfirmationCodeCommand,
  type SignUpCommandOutput,
  type InitiateAuthCommandOutput,
  type GetUserCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac } from 'crypto';

import { DbService } from '../db/db.service';
import { enrollments, resources, users } from '../db/schema';
import { S3Service } from '../s3/s3.service';
import { UserStatsDto } from '../users/dto/user.dto';

import { RegisterDto } from './dto/register.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendConfirmationDto } from './dto/resend-confirmation.dto';

@Injectable()
export class AuthService {
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly userPoolId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly dbService: DbService,
    private readonly s3Service: S3Service,
  ) {
    const region = this.configService.get<string>('AWS_REGION');

    this.userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID')!;

    this.clientId = this.configService.get<string>('COGNITO_CLIENT_ID')!;

    this.clientSecret = this.configService.get<string>(
      'COGNITO_CLIENT_SECRET',
    )!;

    this.cognitoClient = new CognitoIdentityProviderClient({
      region,
    });
  }

  // =========================
  // Register
  // =========================

  async register(registerDto: RegisterDto) {
    const { firstName, middleName, lastName, email, password } = registerDto;

    const secretHash = this.generateSecretHash(email);

    const command = new SignUpCommand({
      ClientId: this.clientId,
      Username: email,
      Password: password,
      SecretHash: secretHash,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        {
          Name: 'given_name',
          Value: firstName,
        },
        {
          Name: 'family_name',
          Value: lastName,
        },
      ],
    });

    let result: SignUpCommandOutput;

    try {
      result = await this.cognitoClient.send(command);
    } catch (error) {
      this.handleCognitoError(error, 'Unable to create account.');
    }

    if (!result.UserSub) {
      throw new UnauthorizedException('Unable to create Cognito user.');
    }

    const now = new Date();

    await this.dbService.db.insert(users).values({
      id: result.UserSub,
      firstName,
      middleName: middleName ?? null,
      lastName,
      email,
      role: 'student',
      status: 'pending',
      profilePhotoUrl: null,
      joinedAt: now,
      updatedAt: now,
    });

    return {
      message:
        'Registration successful. Please check your email to confirm your account.',
    };
  }

  // =========================
  // Confirm Email
  // =========================

  async confirmEmail(confirmEmailDto: ConfirmEmailDto) {
    const { email, code } = confirmEmailDto;

    const secretHash = this.generateSecretHash(email);

    const command = new ConfirmSignUpCommand({
      ClientId: this.clientId,
      Username: email,
      ConfirmationCode: code,
      SecretHash: secretHash,
    });

    try {
      await this.cognitoClient.send(command);
    } catch (error) {
      this.handleCognitoError(error, 'This account cannot be confirmed.');
    }

    await this.dbService.db
      .update(users)
      .set({
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(users.email, email));

    return {
      message: 'Email confirmed successfully.',
    };
  }

  // =========================
  // Resend Confirmation Code
  // =========================

  async resendConfirmationCode(resendConfirmationDto: ResendConfirmationDto) {
    const { email } = resendConfirmationDto;

    // Same response whether or not the account exists, so emails can't be probed.
    const genericResponse = {
      message:
        'If the account exists and is not confirmed, a new code has been sent.',
    };

    const user = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user.length || user[0].status !== 'pending') {
      return genericResponse;
    }

    const command = new ResendConfirmationCodeCommand({
      ClientId: this.clientId,
      Username: email,
      SecretHash: this.generateSecretHash(email),
    });

    try {
      await this.cognitoClient.send(command);
    } catch (error) {
      const name = error instanceof Error ? error.name : '';

      if (
        name === 'UserNotFoundException' ||
        name === 'InvalidParameterException'
      ) {
        return genericResponse;
      }

      this.handleCognitoError(error, 'Unable to send confirmation code.');
    }

    return genericResponse;
  }

  // =========================
  // Login
  // =========================

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user.length) {
      throw new UnauthorizedException('Incorrect email or password.');
    }

    // Status checks happen AFTER the password is verified, so nobody can
    // learn an account's state (pending/inactive) without the right password.
    const secretHash = this.generateSecretHash(email);

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: secretHash,
      },
    });

    let result: InitiateAuthCommandOutput;

    try {
      result = await this.cognitoClient.send(command);
    } catch (error) {
      this.handleCognitoError(error, 'Incorrect email or password.');
    }

    const authenticationResult = result.AuthenticationResult;

    if (!authenticationResult?.AccessToken) {
      throw new UnauthorizedException('Authentication failed.');
    }

    // Password is correct at this point, so it is safe to reveal the status.
    if (user[0].status === 'pending') {
      throw new ForbiddenException(
        'Please confirm your email before signing in.',
      );
    }

    if (user[0].status === 'inactive') {
      throw new UnauthorizedException('Your account has been deactivated.');
    }

    return {
      accessToken: authenticationResult.AccessToken,
      idToken: authenticationResult.IdToken,
      refreshToken: authenticationResult.RefreshToken,
      expiresIn: authenticationResult.ExpiresIn,
      tokenType: authenticationResult.TokenType,
    };
  }

  // =========================
  // Get Current User
  // =========================

  async getMe(accessToken: string) {
    const command = new GetUserCommand({
      AccessToken: accessToken,
    });

    let result: GetUserCommandOutput;

    try {
      result = await this.cognitoClient.send(command);
    } catch (error) {
      this.handleCognitoError(error, 'Invalid or expired access token.');
    }

    const sub = result.UserAttributes?.find(
      (attribute) => attribute.Name === 'sub',
    )?.Value;

    const emailVerified =
      result.UserAttributes?.find(
        (attribute) => attribute.Name === 'email_verified',
      )?.Value === 'true';

    if (!sub) {
      throw new UnauthorizedException('Unable to identify authenticated user.');
    }

    const user = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.id, sub))
      .limit(1);

    if (!user.length) {
      throw new UnauthorizedException('User account not found.');
    }

    const [profilePhotoUrl, stats] = await Promise.all([
      user[0].profilePhotoUrl
        ? this.s3Service.getPresignedUrl(user[0].profilePhotoUrl)
        : Promise.resolve(null),
      this.getUserStats(sub),
    ]);

    return {
      id: user[0].id,
      firstName: user[0].firstName,
      middleName: user[0].middleName,
      lastName: user[0].lastName,
      email: user[0].email,
      role: user[0].role,
      status: user[0].status,
      profilePhotoUrl,
      joinedAt: user[0].joinedAt,
      updatedAt: user[0].updatedAt,
      emailVerified,
      stats,
    };
  }

  // =========================
  // Logout
  // =========================

  async logout(accessToken: string) {
    const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });

    try {
      await this.cognitoClient.send(command);
    } catch (error) {
      this.handleCognitoError(error, 'Invalid or expired access token.');
    }

    return {
      message: 'Signed out successfully.',
    };
  }

  // =========================
  // Forgot Password
  // =========================

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const secretHash = this.generateSecretHash(email);

    const command = new ForgotPasswordCommand({
      ClientId: this.clientId,
      Username: email,
      SecretHash: secretHash,
    });

    try {
      await this.cognitoClient.send(command);
    } catch (error) {
      // Do not reveal whether an email is registered.
      if (error instanceof Error && error.name === 'UserNotFoundException') {
        return {
          message:
            'If the account exists, a password reset code has been sent.',
        };
      }

      this.handleCognitoError(error, 'Unable to send password reset code.');
    }

    return {
      message: 'If the account exists, a password reset code has been sent.',
    };
  }

  // =========================
  // Reset Password
  // =========================

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, code, newPassword } = resetPasswordDto;

    const secretHash = this.generateSecretHash(email);

    const command = new ConfirmForgotPasswordCommand({
      ClientId: this.clientId,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
      SecretHash: secretHash,
    });

    try {
      await this.cognitoClient.send(command);
    } catch (error) {
      this.handleCognitoError(error, 'Unable to reset password.');
    }

    return {
      message: 'Password reset successfully.',
    };
  }

  // =========================
  // Refresh Token
  // =========================

  async refreshToken(refreshToken: string, email: string) {
    const user = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user.length) {
      throw new UnauthorizedException('User account not found.');
    }

    if (user[0].status !== 'active') {
      throw new UnauthorizedException('Your account is not active.');
    }

    console.log(`[refresh] ${new Date().toISOString()} user=${user[0].id}`);

    const secretHash = this.generateSecretHash(user[0].id);

    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: this.clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        SECRET_HASH: secretHash,
      },
    });

    let result: InitiateAuthCommandOutput;

    try {
      result = await this.cognitoClient.send(command);
    } catch (error) {
      this.handleCognitoError(error, 'Unable to refresh session.');
    }

    const authenticationResult = result.AuthenticationResult;

    if (!authenticationResult?.AccessToken) {
      throw new UnauthorizedException('Unable to refresh session.');
    }

    return {
      accessToken: authenticationResult.AccessToken,
      idToken: authenticationResult.IdToken,
      expiresIn: authenticationResult.ExpiresIn,
      tokenType: authenticationResult.TokenType,
    };
  }

  // =========================
  // Change Password
  // =========================

  async changePassword(
    accessToken: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const command = new ChangePasswordCommand({
      AccessToken: accessToken,
      PreviousPassword: oldPassword,
      ProposedPassword: newPassword,
    });

    try {
      await this.cognitoClient.send(command);
    } catch (error) {
      this.handleCognitoError(error, 'Current password is incorrect.');
    }

    return {
      message: 'Password changed successfully.',
    };
  }

  // =========================
  // User Stats
  // =========================

  private async getUserStats(userId: string): Promise<UserStatsDto> {
    const [[courses], [uploads], [downloads]] = await Promise.all([
      // Courses the user has joined
      this.dbService.db
        .select({ total: count() })
        .from(enrollments)
        .where(eq(enrollments.userId, userId)),

      // Resources the user has uploaded
      this.dbService.db
        .select({ total: count() })
        .from(resources)
        .where(eq(resources.uploadedById, userId)),

      // Total downloads across all of the user's resources
      this.dbService.db
        .select({
          total: sql<number>`coalesce(sum(${resources.downloads}), 0)`.mapWith(
            Number,
          ),
        })
        .from(resources)
        .where(eq(resources.uploadedById, userId)),
    ]);

    return {
      coursesJoined: courses.total,
      resourcesUploaded: uploads.total,
      totalDownloads: downloads.total,
    };
  }

  // =========================
  // Cognito Error Mapping
  // =========================

  /**
   * Converts AWS Cognito errors into proper HTTP errors so the client
   * gets a clear message instead of a generic 500.
   * `notAuthorizedMessage` is used for NotAuthorizedException because its
   * meaning depends on the operation (wrong password, bad token, etc.).
   */
  private handleCognitoError(
    error: unknown,
    notAuthorizedMessage: string,
  ): never {
    const name = error instanceof Error ? error.name : '';
    const message = error instanceof Error ? error.message : '';

    switch (name) {
      case 'InvalidPasswordException':
        throw new BadRequestException(message);

      case 'InvalidParameterException':
        throw new BadRequestException(message);

      case 'UsernameExistsException':
        throw new ConflictException(
          'An account with this email already exists.',
        );

      case 'CodeMismatchException':
        throw new BadRequestException('Invalid verification code.');

      case 'ExpiredCodeException':
        throw new BadRequestException(
          'Verification code has expired. Please request a new one.',
        );

      case 'NotAuthorizedException':
      case 'UserNotFoundException':
        throw new UnauthorizedException(notAuthorizedMessage);

      case 'UserNotConfirmedException':
        throw new ForbiddenException(
          'Please confirm your email before signing in.',
        );

      case 'LimitExceededException':
      case 'TooManyRequestsException':
      case 'TooManyFailedAttemptsException':
        throw new HttpException(
          'Too many attempts. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );

      default:
        throw error;
    }
  }

  // =========================
  // Secret Hash
  // =========================

  private generateSecretHash(username: string): string {
    return createHmac('sha256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }
}
