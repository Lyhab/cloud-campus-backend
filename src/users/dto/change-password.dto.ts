import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'CurrentPassword123!',
    description: 'Current password',
    format: 'password',
  })
  oldPassword!: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    description: 'New password',
    format: 'password',
  })
  newPassword!: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    description: 'Confirmation of the new password',
    format: 'password',
  })
  confirmPassword!: string;
}
