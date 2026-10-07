import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ResendConfirmationDto } from './dto/resend-confirmation.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthGuard } from './guards/auth.guard';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USERNAME_COOKIE,
  clearAuthCookies,
  readCookie,
  setAuthCookies,
} from './auth.cookies';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account using AWS Cognito.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description:
      'User registered successfully. Email confirmation may be required.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid registration details.',
  })
  @ApiResponse({
    status: 409,
    description: 'An account with this email already exists.',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('confirm-email')
  @ApiOperation({
    summary: 'Confirm user email',
    description:
      'Confirms a newly registered Cognito account using the verification code sent by email.',
  })
  @ApiBody({ type: ConfirmEmailDto })
  @ApiResponse({
    status: 201,
    description: 'Email confirmed successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification code.',
  })
  async confirmEmail(@Body() confirmEmailDto: ConfirmEmailDto) {
    return this.authService.confirmEmail(confirmEmailDto);
  }

  @Post('resend-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend email confirmation code',
    description:
      'Sends a new confirmation code to an unconfirmed account. Always returns the same response so registered emails cannot be probed.',
  })
  @ApiBody({ type: ResendConfirmationDto })
  @ApiResponse({
    status: 200,
    description: 'Code sent if the account exists and is unconfirmed.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many attempts. Please try again later.',
  })
  async resendCode(@Body() resendConfirmationDto: ResendConfirmationDto) {
    return this.authService.resendConfirmationCode(resendConfirmationDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Log in user',
    description:
      'Authenticates a user with AWS Cognito and stores authentication tokens in HttpOnly cookies.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'User authenticated successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password.',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.login(loginDto);

    setAuthCookies(
      response,
      tokens,
      loginDto.email,
      loginDto.rememberMe ?? false,
    );

    return {
      message: 'Signed in successfully.',
    };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get current authenticated user',
    description: 'Returns the current authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current authenticated user returned successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid access token.',
  })
  async getMe(@Req() request: Request) {
    const accessToken =
      readCookie(request, ACCESS_TOKEN_COOKIE) ??
      request.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!accessToken) {
      throw new UnauthorizedException('Access token is required.');
    }

    return this.authService.getMe(accessToken);
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Log out user',
    description: 'Signs out the current user from AWS Cognito.',
  })
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully.',
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const accessToken =
      readCookie(request, ACCESS_TOKEN_COOKIE) ??
      request.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (accessToken) {
      await this.authService.logout(accessToken);
    }

    clearAuthCookies(response);

    return {
      message: 'Logged out successfully.',
    };
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Sends a password reset verification code to the user through AWS Cognito.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 201,
    description: 'Password reset code sent successfully.',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description:
      'Resets the user password using the verification code sent by AWS Cognito.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 201,
    description: 'Password reset successfully.',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    // Partial: the browser sends tokens via cookies, so the body is usually
    // empty. A required DTO here would make ValidationPipe return 400.
    @Body() refreshDto: Partial<RefreshTokenDto> = {},
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken =
      readCookie(request, REFRESH_TOKEN_COOKIE) ?? refreshDto.refreshToken;

    const email = readCookie(request, USERNAME_COOKIE) ?? refreshDto.email;

    if (!refreshToken || !email) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const tokens = await this.authService.refreshToken(refreshToken, email);

    setAuthCookies(response, tokens, email, true);

    return {
      message: 'Session refreshed.',
    };
  }
}
