import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'student@example.com',
    description: 'Email address of the account resetting its password',
  })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Password reset verification code sent by email',
  })
  code: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    description: 'New password for the user account',
    format: 'password',
  })
  newPassword: string;
}
