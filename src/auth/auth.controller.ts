import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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

  @Post('login')
  @ApiOperation({
    summary: 'Log in user',
    description:
      'Authenticates a user with AWS Cognito and returns authentication tokens.',
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
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current authenticated user',
    description:
      'Returns the current Cognito user using the supplied Bearer access token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current authenticated user returned successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid access token.',
  })
  async getMe(@Headers('authorization') authorization?: string) {
    const accessToken = authorization?.replace(/^Bearer\s+/i, '');

    if (!accessToken) {
      throw new UnauthorizedException('Access token is required.');
    }

    return this.authService.getMe(accessToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Log out user',
    description:
      'Signs out the current user from AWS Cognito using the supplied Bearer access token.',
  })
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid access token.',
  })
  async logout(@Headers('authorization') authorization?: string) {
    const accessToken = authorization?.replace(/^Bearer\s+/i, '');

    if (!accessToken) {
      throw new UnauthorizedException('Access token is required.');
    }

    return this.authService.logout(accessToken);
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
  @ApiResponse({
    status: 400,
    description: 'Unable to process the password reset request.',
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
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired password reset code.',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
