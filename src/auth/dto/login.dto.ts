import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'student@example.com',
    description: 'Email address of the user',
  })
  email!: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Password for the user account',
    format: 'password',
  })
  password!: string;
}
